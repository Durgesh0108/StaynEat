"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed, Leaf, Flame } from "lucide-react";
import { MenuItem, MenuCategory, SpiceLevel } from "@/types";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageUploader } from "@/components/ui/image-uploader";
import { formatCurrency } from "@/utils/formatCurrency";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/utils/cn";

const CATEGORIES: MenuCategory[] = ["STARTER", "MAIN_COURSE", "DESSERT", "BEVERAGE", "SNACK", "SPECIAL"];
const CATEGORY_LABELS: Record<MenuCategory, string> = {
  STARTER: "Starter",
  MAIN_COURSE: "Main Course",
  DESSERT: "Dessert",
  BEVERAGE: "Beverage",
  SNACK: "Snack",
  SPECIAL: "Chef's Special",
};

const schema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().optional(),
  price: z.number().min(0.01, "Price required"),
  category: z.enum(["STARTER", "MAIN_COURSE", "DESSERT", "BEVERAGE", "SNACK", "SPECIAL"]),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  preparationTime: z.number().min(1).optional(),
  spiceLevel: z.enum(["MILD", "MEDIUM", "HOT", "EXTRA_HOT"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface MenuManagementProps {
  businessId: string;
  initialItems: MenuItem[];
}

export function MenuManagement({ businessId, initialItems }: MenuManagementProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MenuItem | null>(null);
  const [image, setImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "MAIN_COURSE", isVeg: true, isAvailable: true, isFeatured: false, preparationTime: 15 },
  });

  const filteredItems = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);
  const categories = Array.from(new Set(items.map((i) => i.category)));

  const openAdd = () => {
    setEditingItem(null);
    setImage("");
    reset({ category: "MAIN_COURSE", isVeg: true, isAvailable: true, isFeatured: false, preparationTime: 15 });
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImage(item.image ?? "");
    reset({
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      category: item.category as MenuCategory,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      preparationTime: item.preparationTime,
      spiceLevel: item.spiceLevel as SpiceLevel | undefined,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = { ...data, businessId, image: image || undefined };
      const url = editingItem ? `/api/menu-items/${editingItem.id}` : "/api/menu-items";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      if (editingItem) {
        setItems(items.map((i) => (i.id === editingItem.id ? json.item : i)));
        toast.success("Menu item updated");
      } else {
        setItems([...items, json.item]);
        toast.success("Menu item added");
      }
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save item");
    } finally { setLoading(false); }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (res.ok) {
        setItems(items.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)));
      }
    } catch { toast.error("Failed to update"); }
  };

  const deleteItem = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      await fetch(`/api/menu-items/${deleteConfirm.id}`, { method: "DELETE" });
      setItems(items.filter((i) => i.id !== deleteConfirm.id));
      toast.success("Item deleted");
      setDeleteConfirm(null);
    } catch { toast.error("Failed to delete"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveCategory("all")} className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${activeCategory === "all" ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
            All ({items.length})
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${activeCategory === c ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
              {CATEGORY_LABELS[c as MenuCategory]} ({items.filter((i) => i.category === c).length})
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm ml-3 flex-shrink-0">
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items"
          description="Add your first menu item to start accepting orders."
          action={{ label: "Add Menu Item", onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="card overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex gap-3 p-3">
                {item.image ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className={cn("w-3 h-3 border flex items-center justify-center rounded-sm", item.isVeg ? "border-green-600" : "border-red-600")}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", item.isVeg ? "bg-green-600" : "bg-red-600")} />
                        </div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                      </div>
                      <p className="text-xs text-gray-400">{CATEGORY_LABELS[item.category as MenuCategory]}</p>
                    </div>
                    <button onClick={() => toggleAvailability(item)} className="flex-shrink-0 mt-0.5">
                      {item.isAvailable ? (
                        <ToggleRight className="h-5 w-5 text-success-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary-600 dark:text-primary-400 text-sm">{formatCurrency(item.price)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-primary-600">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(item)} className="p-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-danger-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Edit Menu Item" : "Add Menu Item"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Item Name *</label>
              <input {...register("name")} placeholder="Butter Chicken" className="input" />
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Category *</label>
              <select {...register("category")} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register("description")} rows={2} placeholder="Brief description..." className="input resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Price (₹) *</label>
              <input {...register("price", { valueAsNumber: true })} type="number" step="0.01" placeholder="250" className="input" />
              {errors.price && <p className="text-danger-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Prep Time (min)</label>
              <input {...register("preparationTime", { valueAsNumber: true })} type="number" placeholder="15" className="input" />
            </div>
            <div>
              <label className="label">Spice Level</label>
              <select {...register("spiceLevel")} className="input">
                <option value="">None</option>
                {["MILD", "MEDIUM", "HOT", "EXTRA_HOT"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-6">
            <Controller control={control} name="isVeg" render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={cn("w-8 h-4 rounded-full transition-colors", field.value ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600")} onClick={() => field.onChange(!field.value)}>
                  <div className={cn("w-4 h-4 bg-white rounded-full shadow transition-transform", field.value ? "translate-x-4" : "translate-x-0")} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Leaf className={cn("h-3.5 w-3.5", field.value ? "text-green-500" : "text-gray-400")} />
                  {field.value ? "Vegetarian" : "Non-Vegetarian"}
                </span>
              </label>
            )} />
            <Controller control={control} name="isAvailable" render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-4 h-4 accent-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Available</span>
              </label>
            )} />
            <Controller control={control} name="isFeatured" render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-4 h-4 accent-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
              </label>
            )} />
          </div>

          <ImageUploader
            value={image}
            onChange={(url) => setImage(url as string)}
            folder="hospitpro/menu"
            label="Item Photo"
          />

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteItem}
        title="Delete Menu Item"
        description={`Delete "${deleteConfirm?.name}"? This cannot be undone.`}
        loading={loading}
      />
    </>
  );
}

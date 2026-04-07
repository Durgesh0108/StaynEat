"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const schema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().min(1),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  validFrom: z.string(),
  validUntil: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
}

interface CouponsClientProps {
  businessId: string;
  initialCoupons: Coupon[];
}

export function CouponsClient({ businessId, initialCoupons }: CouponsClientProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "PERCENTAGE",
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    },
  });

  const couponType = watch("type");

  const onSubmit = async (data: FormData) => {
    setLoading("create");
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, businessId }),
      });
      const json = await res.json();
      if (res.ok) {
        setCoupons((prev) => [json, ...prev]);
        setShowModal(false);
        reset();
        toast.success("Coupon created");
      } else {
        toast.error(json.error ?? "Failed to create coupon");
      }
    } catch {
      toast.error("Failed to create coupon");
    } finally {
      setLoading(null);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
      }
    } catch {
      toast.error("Failed to update coupon");
    } finally {
      setLoading(null);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    setLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        toast.success("Coupon deleted");
      }
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setLoading(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="card p-10 text-center">
          <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No coupons yet. Create your first discount coupon!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {coupons.map((coupon) => {
            const expired = new Date(coupon.validUntil) < now;
            const exhausted = coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
            return (
              <div key={coupon.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                      <Tag className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{coupon.code}</span>
                        <button onClick={() => copyCode(coupon.code)} className="text-gray-400 hover:text-gray-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {coupon.type === "PERCENTAGE"
                          ? `${coupon.value}% off${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ""}`
                          : `₹${coupon.value} off`}
                        {coupon.minOrderValue ? ` · Min ₹${coupon.minOrderValue}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {coupon.usedCount}/{coupon.usageLimit ?? "∞"} used
                      </p>
                      <p className="text-xs text-gray-400">
                        Until {format(new Date(coupon.validUntil), "dd MMM yy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`badge text-xs ${
                        !coupon.isActive ? "bg-gray-100 text-gray-500" :
                        expired ? "bg-danger-100 text-danger-600" :
                        exhausted ? "bg-amber-100 text-amber-600" :
                        "bg-success-100 text-success-700"
                      }`}>
                        {!coupon.isActive ? "Inactive" : expired ? "Expired" : exhausted ? "Exhausted" : "Active"}
                      </span>
                      <button
                        onClick={() => toggleActive(coupon.id, coupon.isActive)}
                        disabled={loading === coupon.id}
                        className="text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="h-5 w-5 text-primary-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteCoupon(coupon.id)}
                        disabled={loading === `delete-${coupon.id}`}
                        className="text-gray-400 hover:text-danger-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset(); }} title="Create Coupon">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Coupon Code *</label>
              <input {...register("code")} className="input uppercase" placeholder="SAVE20" />
              {errors.code && <p className="text-danger-500 text-xs mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <label className="label">Type *</label>
              <select {...register("type")} className="input">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Value * {couponType === "PERCENTAGE" ? "(%)" : "(₹)"}</label>
              <input {...register("value", { valueAsNumber: true })} type="number" className="input" min="1" />
              {errors.value && <p className="text-danger-500 text-xs mt-1">{errors.value.message}</p>}
            </div>
            <div>
              <label className="label">Min Order Value (₹)</label>
              <input {...register("minOrderValue", { valueAsNumber: true, setValueAs: (v) => v === "" ? undefined : Number(v) })} type="number" className="input" min="0" />
            </div>
          </div>

          {couponType === "PERCENTAGE" && (
            <div>
              <label className="label">Max Discount (₹)</label>
              <input {...register("maxDiscount", { valueAsNumber: true, setValueAs: (v) => v === "" ? undefined : Number(v) })} type="number" className="input" min="0" />
            </div>
          )}

          <div>
            <label className="label">Usage Limit</label>
            <input
              {...register("usageLimit", { valueAsNumber: true, setValueAs: (v) => v === "" ? undefined : Number(v) })}
              type="number"
              className="input"
              min="1"
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valid From *</label>
              <input {...register("validFrom")} type="date" className="input" />
            </div>
            <div>
              <label className="label">Valid Until *</label>
              <input {...register("validUntil")} type="date" className="input" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading === "create"} className="btn-primary flex-1 text-sm">
              {loading === "create" ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

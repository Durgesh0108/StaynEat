"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, X, ChevronRight, Leaf, Flame,
  Search, Clock, Building, BedDouble, ChefHat, CheckCircle2,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { MenuItem, MenuCategory } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCartStore } from "@/stores/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

const CATEGORY_LABELS: Record<MenuCategory, string> = {
  STARTER: "Starters",
  MAIN_COURSE: "Main Course",
  DESSERT: "Desserts",
  BEVERAGE: "Beverages",
  SNACK: "Snacks",
  SPECIAL: "Chef's Special",
};

const SPICE_COLORS = {
  MILD: "text-green-500",
  MEDIUM: "text-amber-500",
  HOT: "text-orange-500",
  EXTRA_HOT: "text-red-500",
};

interface HotelRoomMenuPageProps {
  business: {
    id: string;
    slug: string;
    name: string;
    logo?: string | null;
    settings?: { taxPercentage: number; acceptOnlinePayment: boolean; acceptOfflinePayment: boolean } | null;
    menuItems: MenuItem[];
  };
  initialRoom: { id: string; roomNumber: string; name: string; floor?: number | null } | null;
}

function MenuItemCard({
  item, quantity, onAdd, onRemove,
}: {
  item: MenuItem; quantity: number; onAdd: () => void; onRemove: () => void;
}) {
  return (
    <div className="card flex gap-3 p-3 hover:shadow-sm transition-shadow">
      {item.image && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className={cn("w-4 h-4 border-2 flex items-center justify-center rounded-sm flex-shrink-0", item.isVeg ? "border-green-600" : "border-red-600")}>
                <div className={cn("w-2 h-2 rounded-full", item.isVeg ? "bg-green-600" : "bg-red-600")} />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.name}</h3>
            </div>
            {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {item.spiceLevel && (
            <span className={cn("flex items-center gap-0.5 text-xs", SPICE_COLORS[item.spiceLevel])}>
              <Flame className="h-3 w-3" />{item.spiceLevel.replace("_", " ")}
            </span>
          )}
          {item.preparationTime && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <Clock className="h-3 w-3" />{item.preparationTime}m
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-primary-600 dark:text-primary-400 text-sm">{formatCurrency(item.price)}</span>
          {!item.isAvailable ? (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">Unavailable</span>
          ) : quantity === 0 ? (
            <button onClick={onAdd} className="flex items-center gap-1 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors">
              <Plus className="h-3 w-3" />Add
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-950 rounded-lg px-2 py-1">
              <button onClick={onRemove} className="text-primary-600 dark:text-primary-400"><Minus className="h-3 w-3" /></button>
              <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm min-w-4 text-center">{quantity}</span>
              <button onClick={onAdd} className="text-primary-600 dark:text-primary-400"><Plus className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LiveOrderItem {
  id: string;
  quantity: number;
  totalPrice: number;
  menuItem: { name: string };
}
interface LiveOrder {
  id: string;
  status: string;
  items: LiveOrderItem[];
}

function OrderTracker({ sessionId, businessId }: { sessionId: string; businessId: string }) {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [expanded, setExpanded] = useState(true);

  const STATUS_LABEL: Record<string, string> = {
    PENDING: "Waiting",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY: "Ready to serve",
    DELIVERED: "Delivered",
  };
  const STATUS_COLOR: Record<string, string> = {
    PENDING: "text-amber-500 bg-amber-50 dark:bg-amber-950",
    CONFIRMED: "text-blue-500 bg-blue-50 dark:bg-blue-950",
    PREPARING: "text-orange-500 bg-orange-50 dark:bg-orange-950",
    READY: "text-teal-600 bg-teal-50 dark:bg-teal-950",
    DELIVERED: "text-success-600 bg-success-50 dark:bg-success-950",
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/session?sessionId=${sessionId}&businessId=${businessId}`);
      const json = await res.json();
      setOrders(json.orders ?? []);
    } catch { /* silent */ }
  }, [sessionId, businessId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (orders.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      <div className="card overflow-hidden">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50"
        >
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-primary-500" />
            Your Orders ({orders.length})
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {expanded && (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {orders.map((order) => (
              <div key={order.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  {order.status === "DELIVERED" && <CheckCircle2 className="h-4 w-4 text-success-500" />}
                </div>
                <div className="space-y-0.5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{item.quantity}× {item.menuItem.name}</span>
                      <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HotelRoomMenuPage({ business, initialRoom }: HotelRoomMenuPageProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  const { items, addItem, removeItem, updateQuantity, getSubtotal, getTaxAmount, getTotal, getItemCount, setBusiness, setRoom, setSession, sessionId, initSession, clearItems } = useCartStore();
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    setBusiness(business.id, business.slug);
    if (initialRoom) {
      setRoom(initialRoom.id, initialRoom.roomNumber);
      fetch(`/api/public/room-session?roomId=${initialRoom.id}`)
        .then((r) => r.json())
        .then((data) => { if (data.sessionId) setSession(data.sessionId); })
        .catch(() => {/* use local fallback */});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoom?.id]);

  const categories = useMemo(() => Array.from(new Set(business.menuItems.map((i) => i.category))), [business.menuItems]);

  const filteredItems = useMemo(() => business.menuItems.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (vegFilter === "veg" && !item.isVeg) return false;
    if (vegFilter === "nonveg" && item.isVeg) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [business.menuItems, activeCategory, vegFilter, search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const getItemQuantity = (itemId: string) => items.find((i) => i.menuItem.id === itemId)?.quantity ?? 0;

  const getOrder = async () => {
    if (items.length === 0) return;
    const sid = sessionId ?? initSession();
    setPlacingOrder(true);
    try {
      const taxRate = business.settings?.taxPercentage ?? 18;
      const subtotal = getSubtotal();
      const taxAmount = Math.round((subtotal * taxRate) / 100);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          roomId: initialRoom?.id ?? undefined,
          sessionId: sid,
          type: "ROOM_SERVICE",
          paymentMethod: "OFFLINE",
          guestName: "Room Guest",
          guestPhone: "0000000000",
          items: items.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            unitPrice: i.menuItem.price,
            totalPrice: i.menuItem.price * i.quantity,
          })),
          subtotal,
          taxAmount,
          discountAmount: 0,
          totalAmount: subtotal + taxAmount,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      clearItems();
      setCartOpen(false);
      toast.success("Order placed! We'll deliver to your room shortly.", { duration: 3000 });
    } catch {
      toast.error("Failed to place order. Try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const taxPercentage = business.settings?.taxPercentage ?? 18;
  const cartCount = getItemCount();
  const subtotal = getSubtotal();
  const tax = getTaxAmount(taxPercentage);
  const total = getTotal(taxPercentage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {business.logo ? (
                <Image src={business.logo} alt={business.name} width={32} height={32} className="rounded-lg" />
              ) : (
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{business.name}</p>
                {initialRoom && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />Room {initialRoom.roomNumber} · Room Service
                  </p>
                )}
              </div>
            </div>
            {cartCount > 0 && (
              <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
                <ShoppingCart className="h-4 w-4" />{cartCount}
                <span className="hidden sm:inline">· {formatCurrency(total)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search dishes..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
        <div className="flex gap-2">
          {["all", "veg", "nonveg"].map((f) => (
            <button key={f} onClick={() => setVegFilter(f as typeof vegFilter)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                vegFilter === f
                  ? f === "veg" ? "bg-green-50 border-green-300 text-green-700" : f === "nonveg" ? "bg-red-50 border-red-300 text-red-700" : "bg-primary-50 border-primary-300 text-primary-700"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              )}>
              {f === "veg" && <Leaf className="h-3 w-3" />}
              {f === "all" ? "All" : f === "veg" ? "Veg" : "Non-Veg"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setActiveCategory("all")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeCategory === "all" ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700")}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                activeCategory === cat ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700")}>
              {CATEGORY_LABELS[cat as MenuCategory] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-2xl mx-auto px-4 pb-24 space-y-6">
        {Object.entries(groupedItems).map(([category, catItems]) => (
          <div key={category}>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              {CATEGORY_LABELS[category as MenuCategory] ?? category}
              <span className="ml-2 text-xs text-gray-400 font-normal">({catItems.length})</span>
            </h2>
            <div className="space-y-3">
              {catItems.map((item) => (
                <MenuItemCard key={item.id} item={item} quantity={getItemQuantity(item.id)}
                  onAdd={() => { addItem(item); toast.success(`${item.name} added`, { duration: 1500 }); }}
                  onRemove={() => { const qty = getItemQuantity(item.id); if (qty > 1) updateQuantity(item.id, qty - 1); else removeItem(item.id); }}
                />
              ))}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-400"><p>No items found</p></div>
        )}
      </div>

      {/* Live Order Tracker */}
      {sessionId && (
        <OrderTracker sessionId={sessionId} businessId={business.id} />
      )}

      {/* Bottom Bar */}
      {(cartCount > 0 || sessionId) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg z-20">
          <div className="max-w-2xl mx-auto space-y-2">
            {cartCount > 0 && (
              <button onClick={() => setCartOpen(true)} className="w-full btn-primary flex items-center justify-between py-3.5 px-5">
                <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold">{cartCount}</span>
                <span className="font-semibold">View Order</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </button>
            )}
            {sessionId && (
              <button
                onClick={() => router.push(`/h/${business.slug}/bill?session=${sessionId}`)}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm"
              >
                Request Final Bill<ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Your Order</h3>
                  {initialRoom && <p className="text-xs text-primary-600 dark:text-primary-400">Room {initialRoom.roomNumber} · Room Service</p>}
                </div>
                <button onClick={() => setCartOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
                {items.map((cartItem) => (
                  <div key={cartItem.menuItem.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cartItem.menuItem.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(cartItem.menuItem.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
                      <button onClick={() => { if (cartItem.quantity > 1) updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1); else removeItem(cartItem.menuItem.id); }}>
                        <Minus className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{cartItem.quantity}</span>
                      <button onClick={() => addItem(cartItem.menuItem)}>
                        <Plus className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold w-16 text-right text-gray-900 dark:text-white">{formatCurrency(cartItem.menuItem.price * cartItem.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>GST ({taxPercentage}%)</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>Total</span><span className="text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <button onClick={getOrder} disabled={placingOrder} className="w-full btn-primary flex items-center justify-center gap-2 py-3">
                    {placingOrder ? "Placing..." : "Get Order"}
                  </button>
                  {sessionId && (
                    <button
                      onClick={() => { setCartOpen(false); router.push(`/h/${business.slug}/bill?session=${sessionId}`); }}
                      className="w-full btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm"
                    >
                      Request Final Bill<ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

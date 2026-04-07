"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, ChefHat, CheckCircle } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { differenceInMinutes } from "date-fns";
import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface ExtendedOrder extends Order {
  table?: { tableNumber: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    menuItem?: { name: string; isVeg: boolean } | null;
  }>;
}

interface KitchenDisplayProps {
  businessId: string;
  businessName: string;
  initialOrders: ExtendedOrder[];
}

export function KitchenDisplay({ businessId, businessName, initialOrders }: KitchenDisplayProps) {
  const [orders, setOrders] = useState<ExtendedOrder[]>(initialOrders);
  const [now, setNow] = useState(new Date());

  // Tick every minute to update elapsed times
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?businessId=${businessId}&status=CONFIRMED,PREPARING&limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      const newOrders: ExtendedOrder[] = data.data ?? [];
      if (newOrders.length > orders.length) {
        toast.success("New order received!", { icon: "🔔" });
      }
      setOrders(newOrders);
    } catch { /* silent */ }
  }, [businessId, orders.length]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const markReady = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" }),
      });
      if (res.ok) {
        setOrders(orders.filter((o) => o.id !== orderId));
        toast.success("Order marked ready!");
      }
    } catch { toast.error("Failed to update"); }
  };

  const moveToPrep = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING" }),
      });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: "PREPARING" as OrderStatus } : o)));
    } catch { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold">{businessName}</h1>
            <p className="text-gray-400 text-sm">Kitchen Display · Auto-refreshes every 15s</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold text-amber-400">
            {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-gray-500 text-sm">{orders.length} active orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
          <ChefHat className="h-16 w-16 mb-4" />
          <p className="text-xl font-semibold">No active orders</p>
          <p className="text-sm mt-1">Waiting for new orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const minutes = differenceInMinutes(now, new Date(order.createdAt));
            const isLate = minutes > 20;
            const isPreparing = order.status === "PREPARING";

            return (
              <div
                key={order.id}
                className={cn(
                  "rounded-2xl p-5 border-2 transition-colors",
                  isLate
                    ? "bg-red-950 border-red-600"
                    : isPreparing
                    ? "bg-purple-950 border-purple-600"
                    : "bg-gray-900 border-amber-600"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={cn(
                      "text-3xl font-black",
                      isLate ? "text-red-400" : isPreparing ? "text-purple-300" : "text-amber-400"
                    )}>
                      {order.table ? `T-${order.table.tableNumber}` : order.guestName?.slice(0, 8) ?? "—"}
                    </p>
                    <p className="text-gray-400 text-xs font-mono">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg",
                    isLate ? "bg-red-900 text-red-300" : "bg-gray-800 text-gray-300"
                  )}>
                    <Clock className="h-4 w-4" />
                    {minutes}m
                  </div>
                </div>

                {/* Status Badge */}
                <div className={cn(
                  "inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full mb-4",
                  isPreparing ? "bg-purple-900 text-purple-300" : "bg-amber-900 text-amber-300"
                )}>
                  {isPreparing ? "🍳 Preparing" : "⏳ Confirmed"}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-sm border-2 flex-shrink-0",
                        item.menuItem?.isVeg ? "border-green-500" : "border-red-500"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full mx-auto mt-0.5", item.menuItem?.isVeg ? "bg-green-500" : "bg-red-500")} />
                      </div>
                      <span className="flex-1 text-sm text-white truncate">{item.menuItem?.name}</span>
                      <span className={cn(
                        "text-lg font-black",
                        isLate ? "text-red-300" : isPreparing ? "text-purple-300" : "text-amber-300"
                      )}>
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="bg-black/30 rounded-xl p-2 mb-4 text-xs text-amber-300">
                    📝 {order.specialInstructions}
                  </div>
                )}

                {/* Total */}
                <p className="text-gray-400 text-xs mb-4">{formatCurrency(order.totalAmount)}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() => moveToPrep(order.id)}
                      className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      Start Prep
                    </button>
                  )}
                  <button
                    onClick={() => markReady(order.id)}
                    className="flex-1 bg-success-600 hover:bg-success-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Ready
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

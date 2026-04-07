"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCw, Bell } from "lucide-react";
import { OrderStatus } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatTimeAgo } from "@/utils/formatDate";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { differenceInMinutes } from "date-fns";

const COLUMNS: { status: OrderStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending", color: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
  { status: "CONFIRMED", label: "Confirmed", color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
  { status: "PREPARING", label: "Preparing", color: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800" },
  { status: "READY", label: "Ready", color: "bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800" },
  { status: "DELIVERED", label: "Delivered", color: "bg-success-50 dark:bg-green-950 border-green-200 dark:border-green-800" },
];

interface ExtendedOrder extends Record<string, unknown> {
  id: string;
  status: OrderStatus;
  type: string;
  createdAt: Date;
  guestName?: string | null;
  notes?: string | null;
  specialInstructions?: string | null;
  totalAmount: number;
  table?: { tableNumber: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    totalPrice: number;
    menuItem?: { name: string; isVeg: boolean } | null;
  }>;
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: ExtendedOrder;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const minutes = differenceInMinutes(new Date(), new Date(order.createdAt));
  const isLate = minutes > 20;

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDING: "CONFIRMED",
    CONFIRMED: "PREPARING",
    PREPARING: "READY",
    READY: "DELIVERED",
  };

  const next = nextStatus[order.status];

  return (
    <div
      className={cn(
        "card p-3 border",
        isLate && order.status !== "DELIVERED" && order.status !== "CANCELLED"
          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950"
          : "border-gray-100 dark:border-gray-800"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-mono text-xs text-gray-400">#{order.id.slice(-6).toUpperCase()}</p>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">
            {order.table ? `Table ${order.table.tableNumber}` : order.guestName ?? "Guest"}
          </p>
        </div>
        <div className={cn("text-xs flex items-center gap-1 font-medium", isLate ? "text-red-600" : "text-gray-400")}>
          <Clock className="h-3 w-3" />
          {minutes}m ago
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <div className={cn(
              "w-2.5 h-2.5 rounded-sm border flex-shrink-0",
              item.menuItem?.isVeg ? "border-green-500" : "border-red-500"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full mx-auto mt-0.5", item.menuItem?.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
            <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">{item.menuItem?.name}</span>
            <span className="text-gray-400 font-medium">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-lg px-2 py-1 mb-2">
          📝 {order.specialInstructions}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-primary-600 dark:text-primary-400">
          {formatCurrency(order.totalAmount)}
        </span>
        {next && (
          <button
            onClick={() => onStatusChange(order.id, next)}
            className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            → {next.replace("_", " ")}
          </button>
        )}
      </div>
    </div>
  );
}

interface OrdersBoardProps {
  businessId: string;
  initialOrders: ExtendedOrder[];
}

export function OrdersBoard({ businessId, initialOrders }: OrdersBoardProps) {
  const [orders, setOrders] = useState<ExtendedOrder[]>(initialOrders);
  const [lastCount, setLastCount] = useState(initialOrders.length);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?businessId=${businessId}&limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      const newOrders: ExtendedOrder[] = data.data ?? [];

      // Detect new orders
      const newCount = newOrders.filter((o) =>
        ["PENDING", "CONFIRMED"].includes(o.status)
      ).length;

      if (newCount > lastCount) {
        toast.success(`${newCount - lastCount} new order(s)!`, {
          icon: "🔔",
          duration: 5000,
        });
      }
      setLastCount(newCount);
      setOrders(newOrders);
    } catch { /* silent fail */ }
  }, [businessId, lastCount]);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
      toast.success(`Order marked as ${status.replace("_", " ")}`);
    } catch { toast.error("Failed to update order"); }
  };

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {["kanban", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as typeof view)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all capitalize ${
                  view === v ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs px-2.5 py-1.5 rounded-lg">
              <Bell className="h-3 w-3" />
              {pendingCount} pending
            </div>
          )}
        </div>
        <button onClick={fetchOrders} className="btn-secondary text-xs flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className={cn("rounded-xl border p-3 min-h-[300px]", col.color)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{col.label}</h3>
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs flex items-center justify-center font-bold">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={updateStatus} />
                  ))}
                  {colOrders.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No orders</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {orders.map((order) => {
                const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
                  PENDING: "CONFIRMED",
                  CONFIRMED: "PREPARING",
                  PREPARING: "READY",
                  READY: "DELIVERED",
                };
                const next = nextStatus[order.status];
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-400">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="font-medium text-xs text-gray-900 dark:text-white">
                        {order.table ? `Table ${order.table.tableNumber}` : order.guestName ?? "Guest"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {order.items.slice(0, 2).map((i) => i.menuItem?.name).join(", ")}
                      {order.items.length > 2 && ` +${order.items.length - 2}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-sm">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatTimeAgo(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      {next && (
                        <button onClick={() => updateStatus(order.id, next)} className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 transition-colors">
                          → {next.replace("_", " ")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

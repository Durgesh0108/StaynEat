"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, RefreshCw, Bell, Search, ChevronLeft, ChevronRight, Calendar, X, FileText, Printer } from "lucide-react";
import { printThermalReceipt, type ThermalPaperSize } from "@/utils/thermalPrint";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
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
  paymentStatus: string;
  sessionId?: string | null;
  table?: { tableNumber: string } | null;
  room?: { roomNumber: string; name: string } | null;
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
            {order.room
              ? `Room ${order.room.roomNumber}`
              : order.table
              ? `Table ${order.table.tableNumber}`
              : order.guestName ?? "Guest"}
          </p>
          {order.type === "ROOM_SERVICE" && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">Room Service</span>
          )}
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

const PAGE_SIZE = 20;

export function OrdersBoard({ businessId, initialOrders }: OrdersBoardProps) {
  const [orders, setOrders] = useState<ExtendedOrder[]>(initialOrders);
  const [lastCount, setLastCount] = useState(initialOrders.length);
  const [billPaperSize, setBillPaperSize] = useState<ThermalPaperSize>("80mm");
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

  const downloadSessionBill = async (sessionId: string, size: "a4" | ThermalPaperSize = "a4") => {
    setDownloadingBillId(sessionId);
    try {
      const url = `/api/pdf/bill?sessionId=${encodeURIComponent(sessionId)}&businessId=${encodeURIComponent(businessId)}&size=${size}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = size === "a4" ? `bill-${sessionId.slice(-8).toUpperCase()}.pdf` : `receipt-${size}-${sessionId.slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { toast.error("Failed to generate bill PDF"); }
    finally { setDownloadingBillId(null); }
  };

  const printSessionBill = (order: ExtendedOrder) => {
    if (!order.sessionId) return;
    // Gather all orders in the same session from local state
    const sessionOrders = orders.filter((o) => o.sessionId === order.sessionId);
    const grandTotal = sessionOrders.reduce((s, o) => s + o.totalAmount, 0);
    printThermalReceipt(
      {
        type: "food-bill",
        businessName: "",  // unknown here without passing business name; use sessionId as fallback
        billId: order.sessionId,
        tableNumber: order.table?.tableNumber,
        roomNumber: order.room?.roomNumber,
        context: order.type === "ROOM_SERVICE" ? "hotel" : "restaurant",
        orders: sessionOrders.map((o, idx) => ({
          index: idx + 1,
          time: new Date(o.createdAt as Date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          items: o.items.map((i) => ({ name: i.menuItem?.name ?? "Item", qty: i.quantity, price: i.totalPrice })),
          total: o.totalAmount,
        })),
        subtotal: grandTotal,
        tax: 0,
        discount: 0,
        grandTotal,
        paymentMethod: undefined,
      },
      billPaperSize
    );
  };
  const [view, setView] = useState<"kanban" | "list">("kanban");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState<string>("all"); // today | week | month | year | custom

  // Pagination (list view)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialOrders.length);
  const [listLoading, setListLoading] = useState(false);

  // Resolve date range from preset
  const resolvedDates = useMemo(() => {
    const now = new Date();
    if (datePreset === "today") return { from: format(now, "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
    if (datePreset === "week")  return { from: format(subDays(now, 6), "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
    if (datePreset === "month") return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd") };
    if (datePreset === "year")  return { from: format(startOfYear(now), "yyyy-MM-dd"), to: format(endOfYear(now), "yyyy-MM-dd") };
    if (datePreset === "custom") return { from: dateFrom, to: dateTo };
    return { from: "", to: "" };
  }, [datePreset, dateFrom, dateTo]);

  const buildQuery = useCallback((overridePage?: number) => {
    const params = new URLSearchParams({ businessId, limit: String(PAGE_SIZE) });
    params.set("page", String(overridePage ?? page));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search) params.set("search", search);
    if (resolvedDates.from) params.set("dateFrom", resolvedDates.from);
    if (resolvedDates.to)   params.set("dateTo", resolvedDates.to);
    return params.toString();
  }, [businessId, page, statusFilter, typeFilter, search, resolvedDates]);

  const fetchOrders = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setListLoading(true);
      const res = await fetch(`/api/orders?${buildQuery()}`);
      if (!res.ok) return;
      const data = await res.json();
      const newOrders: ExtendedOrder[] = data.data ?? [];
      setTotal(data.total ?? 0);

      if (isBackground) {
        const newCount = newOrders.filter((o) => ["PENDING", "CONFIRMED"].includes(o.status)).length;
        if (newCount > lastCount) {
          toast.success(`${newCount - lastCount} new order(s)!`, { icon: "🔔", duration: 5000 });
        }
        setLastCount(newCount);
      }
      setOrders(newOrders);
    } catch { /* silent fail */ }
    finally { if (!isBackground) setListLoading(false); }
  }, [buildQuery, lastCount]);

  // Re-fetch when filters/page change
  useEffect(() => {
    fetchOrders(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, page, resolvedDates]);

  // Search with debounce
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchOrders(false); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Background poll every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 30000);
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

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Filtered orders for kanban (client-side since kanban loads by status column)
  const filteredOrders = orders.filter((o) => {
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const tableNum = o.table?.tableNumber ?? "";
      const roomNum = o.room?.roomNumber ?? "";
      const guest = o.guestName ?? "";
      if (!tableNum.toLowerCase().includes(q) && !roomNum.toLowerCase().includes(q) && !guest.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      {/* Controls — row 1 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
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
            <Bell className="h-3 w-3" />{pendingCount} pending
          </div>
        )}

        {/* Paper size toggle for receipt printing */}
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setBillPaperSize("80mm")}
              title="80mm standard POS"
              className={`px-2.5 py-1.5 transition-colors ${billPaperSize === "80mm" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >80mm</button>
            <button
              onClick={() => setBillPaperSize("57mm")}
              title="57mm mobile printer"
              className={`px-2.5 py-1.5 border-l border-gray-200 dark:border-gray-700 transition-colors ${billPaperSize === "57mm" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >57mm</button>
          </div>
          <button
            onClick={() => {
              const withSession = orders.find((o) => o.sessionId);
              if (withSession) printSessionBill(withSession);
            }}
            title="Print last session receipt"
            className="p-1.5 btn-secondary text-xs flex items-center gap-1"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Table, room, guest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input py-1.5 pl-8 pr-3 text-xs w-44"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input py-1.5 text-xs w-36"
        >
          <option value="all">All Statuses</option>
          {["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="input py-1.5 text-xs w-36"
        >
          <option value="all">All Types</option>
          <option value="DINE_IN">Dine In</option>
          <option value="ROOM_SERVICE">Room Service</option>
          <option value="TAKEAWAY">Takeaway</option>
        </select>

        <button onClick={() => fetchOrders(false)} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
          <RefreshCw className="h-3 w-3" />Refresh
        </button>
      </div>

      {/* Controls — row 2: Date filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        {[
          { key: "all",    label: "All time" },
          { key: "today",  label: "Today" },
          { key: "week",   label: "This week" },
          { key: "month",  label: "This month" },
          { key: "year",   label: "This year" },
          { key: "custom", label: "Custom range" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setDatePreset(key); setPage(1); }}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-all font-medium",
              datePreset === key
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            )}
          >
            {label}
          </button>
        ))}

        {datePreset === "custom" && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input py-1.5 text-xs w-36"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input py-1.5 text-xs w-36"
            />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {datePreset !== "all" && resolvedDates.from && resolvedDates.to && (
          <span className="text-xs text-gray-400 ml-1">
            {resolvedDates.from === resolvedDates.to
              ? resolvedDates.from
              : `${resolvedDates.from} → ${resolvedDates.to}`}
          </span>
        )}
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
          {COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.status);
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
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {listLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">No orders found</td></tr>
                ) : orders.map((order) => {
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
                          {order.room
                            ? `Room ${order.room.roomNumber}`
                            : order.table
                            ? `Table ${order.table.tableNumber}`
                            : order.guestName ?? "Guest"}
                        </p>
                        {order.type === "ROOM_SERVICE" && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">Room Service</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {order.items.slice(0, 2).map((i) => i.menuItem?.name).join(", ")}
                        {order.items.length > 2 && ` +${order.items.length - 2}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{order.type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatTimeAgo(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {next && (
                            <button onClick={() => updateStatus(order.id, next)} className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 transition-colors">
                              → {next.replace("_", " ")}
                            </button>
                          )}
                          {order.sessionId && (
                            <button
                              onClick={() => downloadSessionBill(order.sessionId!, "a4")}
                              disabled={downloadingBillId === order.sessionId}
                              title="Download session bill (A4 PDF)"
                              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total} orders
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (page <= 4) pageNum = i + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = page - 3 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                        page === pageNum
                          ? "bg-primary-500 text-white border-primary-500"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

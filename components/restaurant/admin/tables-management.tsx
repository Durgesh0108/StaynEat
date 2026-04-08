"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, QrCode, Users, Eye, Receipt, RefreshCw, FileText, Printer, Loader2 } from "lucide-react";
import { printThermalReceipt, type ThermalPaperSize } from "@/utils/thermalPrint";
import { format } from "date-fns";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/utils/formatCurrency";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  tableNumber: z.string().min(1, "Table number required"),
  capacity: z.number().min(1, "Capacity required").max(50),
  floor: z.number().optional(),
  section: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TableWithQR extends Record<string, unknown> {
  id: string;
  tableNumber: string;
  capacity: number;
  floor?: number | null;
  section?: string | null;
  isActive: boolean;
  activeSessionId?: string | null;
  _count?: { orders: number };
  qrCode?: { id: string; url: string; scanCount: number } | null;
}

interface TablesManagementProps {
  businessId: string;
  businessSlug: string;
  businessName: string;
  initialTables: TableWithQR[];
}

interface SessionOrder {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ id: string; quantity: number; totalPrice: number; menuItem?: { name: string } | null }>;
}

function TableOrdersModal({
  table,
  businessId,
  businessName,
  onClose,
}: {
  table: TableWithQR;
  businessId: string;
  businessName: string;
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<SessionOrder[]>([]);
  const [totals, setTotals] = useState({ grandTotal: 0, grandSubtotal: 0, grandTax: 0, grandDiscount: 0, unpaidTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [paperSize, setPaperSize] = useState<ThermalPaperSize>("80mm");

  const fetchOrders = useCallback(async () => {
    if (!table.activeSessionId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/session?sessionId=${table.activeSessionId}&businessId=${businessId}`
      );
      const json = await res.json();
      setOrders(json.orders ?? []);
      setTotals({
        grandTotal: json.grandTotal ?? 0,
        grandSubtotal: json.grandSubtotal ?? 0,
        grandTax: json.grandTax ?? 0,
        grandDiscount: json.grandDiscount ?? 0,
        unpaidTotal: json.unpaidTotal ?? 0,
      });
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [table.activeSessionId, businessId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const generateOfflineBill = async () => {
    if (!table.activeSessionId || totals.unpaidTotal === 0) return;
    setPaying(true);
    try {
      const res = await fetch("/api/orders/session-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: table.activeSessionId,
          businessId,
          paymentMethod: "OFFLINE",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Bill settled! Table is now free.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadPDF = async (size: "a4" | ThermalPaperSize = "a4") => {
    if (!table.activeSessionId) return;
    setGeneratingPDF(true);
    try {
      const url = `/api/pdf/bill?sessionId=${encodeURIComponent(table.activeSessionId)}&businessId=${encodeURIComponent(businessId)}&size=${size}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = size === "a4"
        ? `bill-table${table.tableNumber}-${table.activeSessionId.slice(-6).toUpperCase()}.pdf`
        : `receipt-${size}-table${table.tableNumber}-${table.activeSessionId.slice(-6).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch {
      toast.error("PDF generation failed. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleThermalPrint = () => {
    if (!table.activeSessionId) return;
    printThermalReceipt(
      {
        type: "food-bill",
        businessName,
        billId: table.activeSessionId,
        tableNumber: table.tableNumber,
        context: "restaurant",
        orders: orders.map((order, idx) => ({
          index: idx + 1,
          time: format(new Date(order.createdAt), "hh:mm a"),
          items: order.items.map((item) => ({
            name: item.menuItem?.name ?? "Item",
            qty: item.quantity,
            price: item.totalPrice,
          })),
          total: order.totalAmount,
        })),
        subtotal: totals.grandSubtotal,
        tax: totals.grandTax,
        discount: totals.grandDiscount,
        grandTotal: totals.grandTotal,
      },
      paperSize
    );
  };

  const STATUS_COLOR: Record<string, string> = {
    PENDING: "text-amber-600",
    CONFIRMED: "text-blue-600",
    PREPARING: "text-orange-600",
    READY: "text-teal-600",
    DELIVERED: "text-success-600",
  };

  return (
    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{orders.length} order round(s) for this session</p>
        <button onClick={fetchOrders} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
          <RefreshCw className="h-3 w-3" />Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-6">No orders placed yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order, idx) => (
              <div key={order.id} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Round {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${STATUS_COLOR[order.status] ?? ""}`}>{order.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.paymentStatus === "PAID" ? "bg-success-100 text-success-700" : "bg-amber-100 text-amber-700"}`}>
                      {order.paymentStatus === "PAID" ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-2 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{item.quantity}× {item.menuItem?.name}</span>
                      <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-50 dark:border-gray-800">
                    <span>Round total</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white">
              <span>Grand Total</span>
              <span className="text-primary-600 dark:text-primary-400">{formatCurrency(totals.grandTotal)}</span>
            </div>
            {totals.unpaidTotal > 0 && (
              <div className="flex justify-between text-sm font-semibold text-danger-600">
                <span>Amount Due</span>
                <span>{formatCurrency(totals.unpaidTotal)}</span>
              </div>
            )}
          </div>

          {/* Download / Print Bill */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Download / Print Bill</p>
            <div className="flex gap-2 items-stretch">
              {/* Paper size toggle */}
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setPaperSize("80mm")}
                  title="Standard POS printer"
                  className={`px-2.5 py-1.5 transition-colors ${paperSize === "80mm" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  80mm
                </button>
                <button
                  onClick={() => setPaperSize("57mm")}
                  title="Mobile printer"
                  className={`px-2.5 py-1.5 border-l border-gray-200 dark:border-gray-700 transition-colors ${paperSize === "57mm" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  57mm
                </button>
              </div>
              {/* Thermal print */}
              <button
                onClick={handleThermalPrint}
                className="flex-1 flex items-center justify-center gap-1.5 btn-secondary text-xs py-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Receipt
              </button>
              {/* Thermal PDF */}
              <button
                onClick={() => handleDownloadPDF(paperSize)}
                disabled={generatingPDF}
                title={`Download ${paperSize} receipt PDF`}
                className="flex items-center justify-center gap-1 btn-secondary text-xs px-2.5"
              >
                {generatingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              </button>
            </div>
            {/* A4 bill */}
            <button
              onClick={() => handleDownloadPDF("a4")}
              disabled={generatingPDF}
              className="w-full flex items-center justify-center gap-2 btn-primary text-xs py-2"
            >
              {generatingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              {generatingPDF ? "Generating..." : "Download Full Bill (A4 PDF)"}
            </button>
            <p className="text-xs text-gray-400">80mm = standard POS · 57mm = mobile / card terminal</p>
          </div>

          {totals.unpaidTotal > 0 && (
            <button
              onClick={generateOfflineBill}
              disabled={paying}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Receipt className="h-4 w-4" />
              {paying ? "Processing..." : `Settle Bill — ${formatCurrency(totals.unpaidTotal)} (Cash/Card)`}
            </button>
          )}

          {totals.unpaidTotal === 0 && (
            <div className="bg-success-50 dark:bg-success-900/20 rounded-xl px-4 py-3 text-center text-success-700 dark:text-success-400 text-sm font-medium">
              All orders paid!
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function TablesManagement({ businessId, businessSlug, businessName, initialTables }: TablesManagementProps) {
  const [tables, setTables] = useState<TableWithQR[]>(initialTables);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableWithQR | null>(null);
  const [qrModalTable, setQrModalTable] = useState<TableWithQR | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TableWithQR | null>(null);
  const [ordersTable, setOrdersTable] = useState<TableWithQR | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { capacity: 4 },
  });

  const openAdd = () => {
    setEditingTable(null);
    reset({ capacity: 4 });
    setModalOpen(true);
  };

  const openEdit = (table: TableWithQR) => {
    setEditingTable(table);
    reset({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      floor: table.floor ?? undefined,
      section: table.section ?? "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = { ...data, businessId };
      const url = editingTable ? `/api/tables/${editingTable.id}` : "/api/tables";
      const method = editingTable ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      if (editingTable) {
        setTables(tables.map((t) => (t.id === editingTable.id ? { ...json.table, qrCode: editingTable.qrCode } : t)));
        toast.success("Table updated");
      } else {
        setTables([...tables, json.table]);
        toast.success("Table added");
      }
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save table");
    } finally { setLoading(false); }
  };

  const generateQR = async (table: TableWithQR) => {
    setLoading(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const url = `${appUrl}/r/${businessSlug}/menu?table=${table.tableNumber}`;

      const res = await fetch("/api/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, tableId: table.id, type: "TABLE_MENU", url, label: `Table ${table.tableNumber}` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const updatedTable = { ...table, qrCode: json.qrCode };
      setTables(tables.map((t) => (t.id === table.id ? updatedTable : t)));
      setQrModalTable(updatedTable);
      toast.success("QR code generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate QR");
    } finally { setLoading(false); }
  };

  const deleteTable = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      await fetch(`/api/tables/${deleteConfirm.id}`, { method: "DELETE" });
      setTables(tables.filter((t) => t.id !== deleteConfirm.id));
      toast.success("Table deleted");
      setDeleteConfirm(null);
    } catch { toast.error("Failed to delete"); }
    finally { setLoading(false); }
  };

  const occupiedCount = tables.filter((t) => !!t.activeSessionId).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{tables.length} table{tables.length !== 1 ? "s" : ""}</p>
          {occupiedCount > 0 && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium">
              {occupiedCount} occupied
            </span>
          )}
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Table
        </button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No tables yet"
          description="Add tables and generate QR codes so customers can scan and order."
          action={{ label: "Add First Table", onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => {
            const isOccupied = !!table.activeSessionId;
            return (
              <div
                key={table.id}
                className={`card p-4 group hover:shadow-md transition-shadow ${isOccupied ? "border-amber-300 dark:border-amber-700 border" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-2xl text-primary-600 dark:text-primary-400">
                        T-{table.tableNumber}
                      </h3>
                      {isOccupied && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                          Occupied
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {table.capacity} seats
                      {isOccupied && table._count && table._count.orders > 0 && (
                        <span className="ml-1 text-xs text-orange-500">· {table._count.orders} active orders</span>
                      )}
                    </div>
                    {table.section && (
                      <p className="text-xs text-gray-400 mt-0.5">{table.section}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(table)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-primary-600 transition-colors">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(table)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-danger-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {isOccupied && (
                    <button
                      onClick={() => setOrdersTable(table)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Orders & Bill
                    </button>
                  )}

                  {table.qrCode ? (
                    <button
                      onClick={() => setQrModalTable(table)}
                      className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      {isOccupied ? "QR Code" : "View / Download QR"}
                    </button>
                  ) : (
                    <button
                      onClick={() => generateQR(table)}
                      disabled={loading}
                      className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Generate QR Code
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTable ? "Edit Table" : "Add Table"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="label">Table Number *</label>
            <input {...register("tableNumber")} placeholder="1, 2, A1, etc." className="input" />
            {errors.tableNumber && <p className="text-danger-500 text-xs mt-1">{errors.tableNumber.message}</p>}
          </div>
          <div>
            <label className="label">Seating Capacity *</label>
            <input {...register("capacity", { valueAsNumber: true })} type="number" min="1" max="50" placeholder="4" className="input" />
            {errors.capacity && <p className="text-danger-500 text-xs mt-1">{errors.capacity.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Floor</label>
              <input {...register("floor", { valueAsNumber: true })} type="number" placeholder="1" className="input" />
            </div>
            <div>
              <label className="label">Section</label>
              <input {...register("section")} placeholder="Indoor, Outdoor..." className="input" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : editingTable ? "Update" : "Add Table"}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={!!qrModalTable} onClose={() => setQrModalTable(null)} title={`QR Code — Table ${qrModalTable?.tableNumber}`} size="sm">
        {qrModalTable?.qrCode && (
          <div className="p-6 flex flex-col items-center">
            <QRCodeDisplay
              url={qrModalTable.qrCode.url}
              label={`Table ${qrModalTable.tableNumber} · ${qrModalTable.capacity} seats`}
              size={200}
              showDownload
            />
            <div className="mt-4 w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">QR URL</p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{qrModalTable.qrCode.url}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Orders Modal */}
      <Modal
        isOpen={!!ordersTable}
        onClose={() => setOrdersTable(null)}
        title={`Table ${ordersTable?.tableNumber} — Active Orders`}
        size="md"
      >
        {ordersTable && (
          <TableOrdersModal
            table={ordersTable}
            businessId={businessId}
            businessName={businessName}
            onClose={() => setOrdersTable(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteTable}
        title="Delete Table"
        description={`Delete Table ${deleteConfirm?.tableNumber}? The QR code will also be removed.`}
        loading={loading}
      />
    </>
  );
}

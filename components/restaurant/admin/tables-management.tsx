"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, QrCode, Users } from "lucide-react";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
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
  qrCode?: { id: string; url: string; scanCount: number } | null;
}

interface TablesManagementProps {
  businessId: string;
  businessSlug: string;
  initialTables: TableWithQR[];
}

export function TablesManagement({ businessId, businessSlug, initialTables }: TablesManagementProps) {
  const [tables, setTables] = useState<TableWithQR[]>(initialTables);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableWithQR | null>(null);
  const [qrModalTable, setQrModalTable] = useState<TableWithQR | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TableWithQR | null>(null);
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
        body: JSON.stringify({
          businessId,
          tableId: table.id,
          type: "TABLE_MENU",
          url,
          label: `Table ${table.tableNumber}`,
        }),
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

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{tables.length} table{tables.length !== 1 ? "s" : ""}</p>
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
          {tables.map((table) => (
            <div key={table.id} className="card p-4 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-2xl text-primary-600 dark:text-primary-400">
                    T-{table.tableNumber}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    {table.capacity} seats
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

              {table.qrCode ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-success-600 dark:text-success-400 font-medium">✓ QR Generated</p>
                    <p className="text-xs text-gray-400">{table.qrCode.scanCount} scans</p>
                  </div>
                  <button
                    onClick={() => setQrModalTable(table)}
                    className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    View / Download QR
                  </button>
                </div>
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
          ))}
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

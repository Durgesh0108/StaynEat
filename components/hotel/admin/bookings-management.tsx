"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { BookingStatus } from "@/types";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import toast from "react-hot-toast";
import { format, addDays } from "date-fns";
import {
  CalendarRange,
  Mail,
  MessageCircle,
  ChevronDown,
  CalendarPlus,
  CalendarCheck,
  FileText,
  Printer,
  Loader2,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { printThermalReceipt, type ThermalPaperSize } from "@/utils/thermalPrint";
import { formatDate as fmtDate } from "@/utils/formatDate";

interface ExtendedBooking extends Record<string, unknown> {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  adults: number;
  children: number;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalAmount: number;
  finalAmount: number;
  discountAmount: number;
  paidAmount: number;
  couponCode?: string | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  status: string;
  specialRequests?: string | null;
  notes?: string | null;
  room?: { name: string; roomNumber: string } | null;
}

const STATUS_OPTIONS: BookingStatus[] = [
  "PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW",
];

interface BookingsManagementProps {
  businessId: string;
  initialBookings: ExtendedBooking[];
}

export function BookingsManagement({ businessId, initialBookings }: BookingsManagementProps) {
  const [bookings, setBookings] = useState<ExtendedBooking[]>(initialBookings);
  const [filter, setFilter] = useState<string>("all");
  const [detailBooking, setDetailBooking] = useState<ExtendedBooking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [newCheckOut, setNewCheckOut] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);
  const [earlyCheckoutBooking, setEarlyCheckoutBooking] = useState<ExtendedBooking | null>(null);
  const [collectConfirmOpen, setCollectConfirmOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [receiptPaperSize, setReceiptPaperSize] = useState<ThermalPaperSize>("80mm");

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const updateStatus = async (booking: ExtendedBooking, status: BookingStatus) => {
    setUpdatingId(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setBookings(bookings.map((b) => (b.id === booking.id ? { ...b, status } : b)));
      if (detailBooking?.id === booking.id) setDetailBooking({ ...detailBooking, status });
      toast.success("Status updated");
    } catch { toast.error("Failed to update status"); }
    finally { setUpdatingId(null); }
  };

  const updateCheckOut = async (bookingId: string, checkOut: string) => {
    setExtendLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkOut: new Date(checkOut).toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to update dates");
      const json = await res.json();
      const b = json.booking;
      const updated = {
        ...detailBooking!,
        checkOut: new Date(checkOut),
        nights: b?.nights ?? detailBooking!.nights,
        totalAmount: b?.totalAmount ?? detailBooking!.totalAmount,
        finalAmount: b?.finalAmount ?? detailBooking!.finalAmount,
        paidAmount: b?.paidAmount ?? detailBooking!.paidAmount,
        paymentStatus: b?.paymentStatus ?? detailBooking!.paymentStatus,
      };
      setBookings(bookings.map((b) => (b.id === bookingId ? updated : b)));
      setDetailBooking(updated);
      setExtendModalOpen(false);
      toast.success("Check-out date updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setExtendLoading(false);
    }
  };

  const earlyCheckout = (booking: ExtendedBooking) => {
    setEarlyCheckoutBooking(booking);
  };

  const updatePaymentStatus = async (booking: ExtendedBooking, paymentStatus: string) => {
    setUpdatingId(booking.id);
    try {
      const body: Record<string, unknown> = { paymentStatus };
      const newPaidAmount = paymentStatus === "PAID" ? booking.finalAmount : paymentStatus === "REFUNDED" ? 0 : booking.paidAmount;
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update");
      const patch = { paymentStatus, paidAmount: newPaidAmount };
      setBookings(bookings.map((b) => b.id === booking.id ? { ...b, ...patch } : b));
      if (detailBooking?.id === booking.id) setDetailBooking({ ...detailBooking, ...patch });
      toast.success("Payment status updated");
    } catch { toast.error("Failed to update payment status"); }
    finally { setUpdatingId(null); }
  };

  const handleDownloadPDF = async (bookingId: string) => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/pdf/booking?id=${bookingId}`);
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `booking-${bookingId.slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("PDF generation failed"); }
    finally { setPdfLoading(false); }
  };

  const handleThermalPrint = (booking: ExtendedBooking) => {
    printThermalReceipt(
      {
        type: "booking",
        businessName: booking.room?.name ?? "Hotel",
        bookingId: `#${booking.id.slice(-8).toUpperCase()}`,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        room: booking.room ? `${booking.room.name} #${booking.room.roomNumber}` : undefined,
        checkIn: fmtDate(booking.checkIn),
        checkOut: fmtDate(booking.checkOut),
        nights: booking.nights,
        subtotal: booking.totalAmount,
        tax: Math.max(0, booking.finalAmount - booking.totalAmount + booking.discountAmount),
        discount: booking.discountAmount,
        total: booking.finalAmount,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod ?? "OFFLINE",
      },
      receiptPaperSize
    );
  };

  const whatsappLink = (booking: ExtendedBooking) => {
    if (!booking.guestPhone) return "#";
    const msg = encodeURIComponent(
      `Hi ${booking.guestName}! Your booking at our hotel has been confirmed.\n\n` +
      `Booking ID: #${booking.id.slice(-8).toUpperCase()}\n` +
      `Room: ${booking.room?.name}\n` +
      `Check-in: ${formatDate(booking.checkIn)}\n` +
      `Check-out: ${formatDate(booking.checkOut)}\n` +
      `Total: ${formatCurrency(booking.finalAmount)}`
    );
    return `https://wa.me/${booking.guestPhone.replace(/[^0-9]/g, "")}?text=${msg}`;
  };

  const columns: Column<ExtendedBooking>[] = [
    {
      key: "id",
      header: "Booking ID",
      render: (_, row) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
          #{row.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "guestName",
      header: "Guest",
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{row.guestName}</p>
          <p className="text-xs text-gray-400">{row.guestPhone}</p>
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      render: (_, row) => (
        <span className="text-sm">{row.room?.name ?? "—"}</span>
      ),
    },
    {
      key: "checkIn",
      header: "Dates",
      render: (_, row) => (
        <div className="text-xs">
          <p>{formatDate(row.checkIn)} →</p>
          <p>{formatDate(row.checkOut)}</p>
          <p className="text-gray-400">{row.nights}N</p>
        </div>
      ),
    },
    {
      key: "finalAmount",
      header: "Amount",
      sortable: true,
      render: (_, row) => {
        const effectivePaid = (row.paidAmount ?? 0) > 0 ? row.paidAmount : row.paymentStatus === "PAID" ? row.finalAmount : 0;
        const due = Math.max(0, row.finalAmount - effectivePaid);
        return (
          <div>
            <p className="font-semibold text-sm">{formatCurrency(row.finalAmount)}</p>
            {due > 0 ? (
              <span className="text-xs font-medium text-danger-600 flex items-center gap-0.5">
                <AlertCircle className="h-3 w-3" />Due {formatCurrency(due)}
              </span>
            ) : (
              <StatusBadge status={row.paymentStatus} />
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (_, row) => (
        <div className="relative">
          <div className="flex items-center gap-1">
            <StatusBadge status={row.status} />
            {updatingId !== row.id && (
              <div className="relative group">
                <button className="p-0.5 text-gray-400 hover:text-gray-600">
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-10 py-1 min-w-32 hidden group-hover:block">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); updateStatus(row, s); }}
                      className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setDetailBooking(row); }}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
          >
            View
          </button>
          <a
            href={whatsappLink(row)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
          >
            WA
          </a>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${
              filter === s
                ? "bg-primary-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary-300"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
            {s !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({bookings.filter((b) => b.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search by guest name or phone..."
        onRowClick={(row) => setDetailBooking(row)}
        emptyMessage="No bookings found"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailBooking}
        onClose={() => setDetailBooking(null)}
        title="Booking Details"
        size="lg"
      >
        {detailBooking && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <p className="text-xs text-gray-400 mb-1">Guest</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-sm">
                    {detailBooking.guestName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{detailBooking.guestName}</p>
                    <p className="text-xs text-gray-400">{detailBooking.guestPhone}</p>
                    {detailBooking.guestEmail && (
                      <p className="text-xs text-gray-400">{detailBooking.guestEmail}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-400 mb-1">Room</p>
                <p className="font-medium text-sm">{detailBooking.room?.name}</p>
                <p className="text-xs text-gray-400">Room {detailBooking.room?.roomNumber}</p>
              </div>
            </div>

            <div className="card p-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Check-in</p>
                  <p className="font-medium">{formatDate(detailBooking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Check-out</p>
                  <p className="font-medium">{formatDate(detailBooking.checkOut)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nights</p>
                  <p className="font-medium">{detailBooking.nights}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Adults</p>
                  <p className="font-medium">{detailBooking.adults}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Children</p>
                  <p className="font-medium">{detailBooking.children}</p>
                </div>
              </div>
            </div>

            {(() => {
              // Compute effective paid amount (handle legacy records where paidAmount wasn't tracked)
              const effectivePaid =
                (detailBooking.paidAmount ?? 0) > 0
                  ? detailBooking.paidAmount
                  : detailBooking.paymentStatus === "PAID"
                  ? detailBooking.finalAmount
                  : 0;
              const amountDue = Math.max(0, detailBooking.finalAmount - effectivePaid);

              return (
                <div className="card p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Charges</span>
                    <span className="font-semibold">{formatCurrency(detailBooking.finalAmount)}</span>
                  </div>
                  {effectivePaid > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span>Paid</span>
                      <span className="font-medium">{formatCurrency(effectivePaid)}</span>
                    </div>
                  )}
                  {amountDue > 0 && (
                    <div className="flex justify-between text-sm font-semibold text-danger-600">
                      <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />Amount Due</span>
                      <span>{formatCurrency(amountDue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Booking Status</span>
                    <StatusBadge status={detailBooking.status} />
                  </div>

                  {/* Payment row */}
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-500">Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={detailBooking.paymentStatus} />

                      {/* Collect outstanding amount (cash/card at counter) */}
                      {amountDue > 0 && (
                        <button
                          onClick={() => setCollectConfirmOpen(true)}
                          disabled={updatingId === detailBooking.id}
                          className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                        >
                          {updatingId === detailBooking.id ? "..." : `Collect ${formatCurrency(amountDue)}`}
                        </button>
                      )}

                      {/* Already fully paid — allow refund */}
                      {amountDue === 0 && detailBooking.paymentStatus === "PAID" && (
                        <button
                          onClick={() => updatePaymentStatus(detailBooking, "REFUNDED")}
                          disabled={updatingId === detailBooking.id}
                          className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                          Refund
                        </button>
                      )}

                      {/* Mark as failed (for pending with no amount paid yet) */}
                      {detailBooking.paymentStatus === "PENDING" && effectivePaid === 0 && (
                        <button
                          onClick={() => updatePaymentStatus(detailBooking, "FAILED")}
                          disabled={updatingId === detailBooking.id}
                          className="text-xs px-2.5 py-1 text-red-500 hover:underline font-medium disabled:opacity-50"
                        >
                          Mark Failed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alert when stay was extended with outstanding balance */}
                  {amountDue > 0 && effectivePaid > 0 && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>Stay was extended. Collect the remaining {formatCurrency(amountDue)} before check-out.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {detailBooking.specialRequests && (
              <div className="card p-4">
                <p className="text-xs text-gray-400 mb-1">Special Requests</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{detailBooking.specialRequests}</p>
              </div>
            )}

            {/* Stay adjustments */}
            {(detailBooking.status === "CONFIRMED" || detailBooking.status === "CHECKED_IN") && (
              <div className="card p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adjust Stay</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNewCheckOut(format(addDays(new Date(detailBooking.checkOut), 1), "yyyy-MM-dd"));
                      setExtendModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Extend Stay
                  </button>
                  <button
                    onClick={() => earlyCheckout(detailBooking)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition-colors font-medium"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Early Check-out
                  </button>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div>
              <p className="label mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(detailBooking, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      detailBooking.status === s
                        ? "bg-primary-50 dark:bg-primary-950 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* PDF + Print */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Receipt / PDF</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPDF(detailBooking.id)}
                  disabled={pdfLoading}
                  className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-2"
                >
                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  {pdfLoading ? "Generating..." : "Download PDF (A4)"}
                </button>
                <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-medium">
                  <button
                    onClick={() => setReceiptPaperSize("80mm")}
                    className={`px-2.5 py-1.5 transition-colors ${receiptPaperSize === "80mm" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >80mm</button>
                  <button
                    onClick={() => setReceiptPaperSize("57mm")}
                    className={`px-2.5 py-1.5 border-l border-gray-200 dark:border-gray-700 transition-colors ${receiptPaperSize === "57mm" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >57mm</button>
                </div>
                <button
                  onClick={() => handleThermalPrint(detailBooking)}
                  className="flex items-center gap-1.5 btn-secondary text-sm px-3"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={() => handleDownloadPDF(detailBooking.id)}
                  disabled={pdfLoading}
                  title="Download receipt PDF"
                  className="flex items-center justify-center gap-1 btn-secondary text-sm px-3"
                >
                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <a
                href={whatsappLink(detailBooking)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Guest
              </a>
              {detailBooking.guestEmail && (
                <a
                  href={`mailto:${detailBooking.guestEmail}`}
                  className="flex items-center justify-center gap-2 btn-secondary px-4"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Extend Stay Modal — rendered after Detail Modal so it appears on top */}
      <Modal isOpen={extendModalOpen} onClose={() => setExtendModalOpen(false)} title="Extend Stay" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            Current check-out: <strong>{detailBooking ? formatDate(detailBooking.checkOut) : "—"}</strong>
          </p>
          <div>
            <label className="label">New Check-out Date</label>
            <input
              type="date"
              value={newCheckOut}
              min={format(addDays(new Date(detailBooking?.checkOut ?? new Date()), 1), "yyyy-MM-dd")}
              onChange={(e) => setNewCheckOut(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setExtendModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => detailBooking && updateCheckOut(detailBooking.id, newCheckOut)}
              disabled={!newCheckOut || extendLoading}
              className="btn-primary flex-1"
            >
              {extendLoading ? "Saving..." : "Confirm Extension"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Collect Payment Confirm Modal */}
      {detailBooking && (() => {
        const effectivePaid =
          (detailBooking.paidAmount ?? 0) > 0
            ? detailBooking.paidAmount
            : detailBooking.paymentStatus === "PAID"
            ? detailBooking.finalAmount
            : 0;
        const amountDue = Math.max(0, detailBooking.finalAmount - effectivePaid);
        return (
          <ConfirmModal
            isOpen={collectConfirmOpen}
            onClose={() => setCollectConfirmOpen(false)}
            onConfirm={() => { setCollectConfirmOpen(false); updatePaymentStatus(detailBooking, "PAID"); }}
            title="Collect Payment"
            description={`Confirm you have collected ${formatCurrency(amountDue)} from ${detailBooking.guestName} (cash / card at counter). This will mark the booking as fully paid.`}
            confirmLabel={`Collect ${formatCurrency(amountDue)}`}
            variant="primary"
            loading={updatingId === detailBooking.id}
          />
        );
      })()}

      {/* Early Check-out Confirm Modal */}
      <ConfirmModal
        isOpen={!!earlyCheckoutBooking}
        onClose={() => setEarlyCheckoutBooking(null)}
        onConfirm={() => {
          const booking = earlyCheckoutBooking!;
          setEarlyCheckoutBooking(null);
          updateCheckOut(booking.id, format(new Date(), "yyyy-MM-dd"));
        }}
        title="Early Check-out"
        description={`Set check-out to today (${format(new Date(), "yyyy-MM-dd")}) for ${earlyCheckoutBooking?.guestName ?? "this guest"}?`}
        confirmLabel="Confirm Check-out"
        variant="primary"
      />
    </>
  );
}

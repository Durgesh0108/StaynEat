"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { BookingStatus } from "@/types";
import { Modal } from "@/components/ui/modal";
import toast from "react-hot-toast";
import {
  CalendarRange,
  User,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
} from "lucide-react";

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
      render: (_, row) => (
        <div>
          <p className="font-semibold text-sm">{formatCurrency(row.finalAmount)}</p>
          <StatusBadge status={row.paymentStatus} />
        </div>
      ),
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

            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold">{formatCurrency(detailBooking.finalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Payment Status</span>
                <StatusBadge status={detailBooking.paymentStatus} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Booking Status</span>
                <StatusBadge status={detailBooking.status} />
              </div>
            </div>

            {detailBooking.specialRequests && (
              <div className="card p-4">
                <p className="text-xs text-gray-400 mb-1">Special Requests</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{detailBooking.specialRequests}</p>
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
    </>
  );
}

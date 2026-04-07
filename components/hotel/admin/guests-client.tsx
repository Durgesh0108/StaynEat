"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Users, Search, BedDouble, Phone, Mail, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  room: { roomNumber: string; name: string; type: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CHECKED_IN: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
  CHECKED_OUT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400",
};

export function GuestsClient({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = bookings.filter((b) => {
    const matchSearch = !search ||
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.guestPhone.includes(search) ||
      b.room?.roomNumber.includes(search) ||
      b.guestEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const currentGuests = bookings.filter((b) => b.status === "CHECKED_IN").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Guests", value: bookings.length },
          { label: "Checked In", value: currentGuests },
          { label: "Confirmed", value: bookings.filter((b) => b.status === "CONFIRMED").length },
          { label: "Checked Out", value: bookings.filter((b) => b.status === "CHECKED_OUT").length },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {["ALL", "CHECKED_IN", "CONFIRMED", "CHECKED_OUT", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                statusFilter === s ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"
              )}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Guests List */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No guests found</p>
          <p className="text-sm text-gray-400 mt-1">Guests will appear here after bookings are made</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <div key={booking.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400 font-bold text-sm">
                    {booking.guestName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{booking.guestName}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />{booking.guestPhone}
                      </span>
                      {booking.guestEmail && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />{booking.guestEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", STATUS_COLOR[booking.status] ?? STATUS_COLOR.CONFIRMED)}>
                  {booking.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {booking.room && (
                  <div className="flex items-start gap-1.5">
                    <BedDouble className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Room</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {booking.room.roomNumber} · {booking.room.type}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400">Check-in</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{format(new Date(booking.checkIn), "dd MMM yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400">Check-out</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{format(new Date(booking.checkOut), "dd MMM yyyy")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400">Total · {booking.nights}N</p>
                  <p className="font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(booking.totalAmount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

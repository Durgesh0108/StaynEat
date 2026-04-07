"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Room { id: string; name: string; type: string }
interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
}

interface Props { rooms: Room[]; bookings: Booking[] }

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-primary-500 text-white",
  CHECKED_IN: "bg-success-500 text-white",
};

export function OccupancyCalendar({ rooms, bookings }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tooltip, setTooltip] = useState<{ booking: Booking; x: number; y: number } | null>(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getBookingForRoomDay = (roomId: string, day: Date) => {
    return bookings.find((b) => {
      if (b.roomId !== roomId) return false;
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return isWithinInterval(day, { start: checkIn, end: new Date(checkOut.getTime() - 1) });
    });
  };

  const occupancyRate = () => {
    if (rooms.length === 0 || days.length === 0) return 0;
    const today = new Date();
    const totalSlots = rooms.length;
    const occupied = rooms.filter((r) => getBookingForRoomDay(r.id, today)).length;
    return Math.round((occupied / totalSlots) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-secondary p-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-secondary p-2">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="card px-4 py-2 text-center">
          <p className="text-xs text-gray-500">Today&apos;s Occupancy</p>
          <p className="text-lg font-bold text-primary-600">{occupancyRate()}%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary-500" /> Confirmed
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success-500" /> Checked In
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" /> Available
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-x-auto">
        <div style={{ minWidth: `${days.length * 36 + 140}px` }}>
          {/* Day headers */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <div className="w-36 shrink-0 py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Room</div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`w-9 shrink-0 py-2 text-center text-xs font-medium ${
                  isSameDay(day, new Date())
                    ? "text-primary-600 dark:text-primary-400 font-bold"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <div>{format(day, "d")}</div>
                <div className="text-gray-400 text-xs">{format(day, "EEE")[0]}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {rooms.map((room) => (
            <div key={room.id} className="flex border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="w-36 shrink-0 py-2.5 px-3">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{room.name}</p>
                <p className="text-xs text-gray-400">{room.type}</p>
              </div>
              {days.map((day) => {
                const booking = getBookingForRoomDay(room.id, day);
                const statusColor = booking ? (STATUS_COLORS[booking.status] ?? "bg-gray-400 text-white") : "";
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={`w-9 shrink-0 py-1.5 px-1 flex items-center justify-center cursor-default ${isToday ? "bg-primary-50 dark:bg-primary-900/10" : ""}`}
                    onMouseEnter={(e) => booking && setTooltip({ booking, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <div className={`w-7 h-6 rounded text-xs flex items-center justify-center transition-all ${
                      booking ? statusColor : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      {booking ? "●" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 60 }}
        >
          <p className="font-semibold">{tooltip.booking.guestName}</p>
          <p className="text-gray-300">
            {format(new Date(tooltip.booking.checkIn), "dd MMM")} –{" "}
            {format(new Date(tooltip.booking.checkOut), "dd MMM")}
          </p>
          <p className="text-gray-400">{tooltip.booking.status}</p>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">No active rooms found</div>
      )}
    </div>
  );
}

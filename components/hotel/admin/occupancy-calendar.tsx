"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, isWithinInterval, isBefore, isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight, BedDouble, CheckCircle, Clock, XCircle } from "lucide-react";

interface Room { id: string; name: string; roomNumber: string; type: string }
interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
  nights: number;
  finalAmount: number;
}

interface Props { rooms: Room[]; bookings: Booking[] }

const STATUS: Record<string, { bar: string; badge: string; label: string }> = {
  PENDING:    { bar: "bg-amber-400",   badge: "bg-amber-100 text-amber-700",   label: "Pending" },
  CONFIRMED:  { bar: "bg-primary-500", badge: "bg-primary-100 text-primary-700", label: "Confirmed" },
  CHECKED_IN: { bar: "bg-success-500", badge: "bg-success-100 text-success-700", label: "Checked In" },
};

const COL_W = 36; // px per day column
const ROW_H = 48; // px per room row
const LABEL_W = 160; // px for the room label column

export function OccupancyCalendar({ rooms, bookings }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hovered, setHovered] = useState<Booking | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const today = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Stats
  const todayBookings = bookings.filter((b) => {
    const ci = new Date(b.checkIn);
    const co = new Date(b.checkOut);
    return isWithinInterval(today, { start: ci, end: new Date(co.getTime() - 1) });
  });
  const occupiedToday = new Set(todayBookings.map((b) => b.roomId)).size;
  const occupancyPct = rooms.length > 0 ? Math.round((occupiedToday / rooms.length) * 100) : 0;
  const checkInsToday = bookings.filter((b) => isSameDay(new Date(b.checkIn), today)).length;
  const checkOutsToday = bookings.filter((b) => isSameDay(new Date(b.checkOut), today)).length;

  // For each room, get bookings visible in this month
  const bookingsForRoom = (roomId: string) =>
    bookings.filter((b) => {
      if (b.roomId !== roomId) return false;
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      return ci <= monthEnd && co >= monthStart;
    });

  // Compute the pixel position and width of a booking bar within the month grid
  const barGeometry = (booking: Booking) => {
    const ci = new Date(booking.checkIn);
    const co = new Date(booking.checkOut);
    // Clamp to visible month range
    const visStart = isBefore(ci, monthStart) ? monthStart : ci;
    const visEnd = isAfter(co, monthEnd) ? monthEnd : co;

    const startIdx = days.findIndex((d) => isSameDay(d, visStart));
    // end index = last day the guest occupies (checkOut day is NOT occupied, it's departure)
    const lastOccupied = new Date(visEnd.getTime() - 1);
    const endIdx = days.findLastIndex((d) => d <= lastOccupied);

    if (startIdx === -1 || endIdx < startIdx) return null;

    const left = startIdx * COL_W;
    const width = (endIdx - startIdx + 1) * COL_W - 2; // 2px gap
    const clippedStart = isBefore(ci, monthStart);
    const clippedEnd = isAfter(co, monthEnd);

    return { left, width, clippedStart, clippedEnd, startIdx, endIdx };
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Rooms", value: rooms.length, icon: BedDouble, color: "text-primary-600" },
          { label: "Occupied Today", value: `${occupiedToday} (${occupancyPct}%)`, icon: CheckCircle, color: "text-success-600" },
          { label: "Check-ins Today", value: checkInsToday, icon: Clock, color: "text-amber-600" },
          { label: "Check-outs Today", value: checkOutsToday, icon: XCircle, color: "text-danger-600" },
        ].map((s) => (
          <div key={s.label} className="card p-3 flex items-center gap-3">
            <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Month nav + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-secondary p-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-secondary p-2">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs text-primary-600 dark:text-primary-400 underline"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {Object.entries(STATUS).map(([, s]) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${s.bar}`} />
              {s.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
            Available
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      {rooms.length === 0 ? (
        <div className="card py-16 text-center text-gray-400 text-sm">
          <BedDouble className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No active rooms found.</p>
          <p className="text-xs mt-1">Add rooms in the Rooms section to see the occupancy calendar.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${LABEL_W + days.length * COL_W}px` }}>

              {/* Day headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="shrink-0 py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Room
                </div>
                {days.map((day) => {
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={day.toISOString()}
                      style={{ width: COL_W, minWidth: COL_W }}
                      className={`shrink-0 py-1.5 text-center text-xs select-none border-l border-gray-100 dark:border-gray-800 ${
                        isToday ? "bg-primary-50 dark:bg-primary-900/20" : ""
                      }`}
                    >
                      <div className={`font-semibold ${isToday ? "text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {format(day, "d")}
                      </div>
                      <div className="text-gray-400 dark:text-gray-500">{format(day, "EEEEE")}</div>
                    </div>
                  );
                })}
              </div>

              {/* Room rows */}
              {rooms.map((room, rowIdx) => {
                const roomBookings = bookingsForRoom(room.id);
                return (
                  <div
                    key={room.id}
                    className={`flex relative border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                      rowIdx % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/30"
                    }`}
                    style={{ height: ROW_H }}
                  >
                    {/* Room label */}
                    <div
                      style={{ width: LABEL_W, minWidth: LABEL_W, height: ROW_H }}
                      className="shrink-0 px-3 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700 z-10 bg-white dark:bg-gray-900"
                    >
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
                        {room.name}
                      </p>
                      <p className="text-xs text-gray-400">#{room.roomNumber} · {room.type.replace("_", " ")}</p>
                    </div>

                    {/* Day cells background */}
                    <div className="flex flex-1 relative">
                      {days.map((day) => {
                        const isToday = isSameDay(day, today);
                        return (
                          <div
                            key={day.toISOString()}
                            style={{ width: COL_W, minWidth: COL_W, height: ROW_H }}
                            className={`shrink-0 border-l border-gray-100 dark:border-gray-800 ${
                              isToday ? "bg-primary-50/60 dark:bg-primary-900/10" : ""
                            }`}
                          />
                        );
                      })}

                      {/* Booking bars (absolute positioned) */}
                      {roomBookings.map((booking) => {
                        const geo = barGeometry(booking);
                        if (!geo) return null;
                        const cfg = STATUS[booking.status] ?? STATUS.CONFIRMED;
                        return (
                          <div
                            key={booking.id}
                            className={`absolute top-1/2 -translate-y-1/2 h-7 ${cfg.bar} flex items-center px-2 cursor-pointer select-none z-20 ${
                              geo.clippedStart ? "rounded-r-full" : "rounded-l-full"
                            } ${
                              geo.clippedEnd ? "rounded-l-full" : "rounded-r-full"
                            } ${!geo.clippedStart && !geo.clippedEnd ? "rounded-full" : ""}`}
                            style={{ left: geo.left, width: geo.width }}
                            onMouseEnter={(e) => {
                              setHovered(booking);
                              setTooltipPos({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <span className="text-white text-xs font-medium truncate leading-none">
                              {booking.guestName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hovered && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl pointer-events-none space-y-1"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 80 }}
        >
          <p className="font-semibold text-sm">{hovered.guestName}</p>
          <p className="text-gray-300">
            {format(new Date(hovered.checkIn), "dd MMM yyyy")} → {format(new Date(hovered.checkOut), "dd MMM yyyy")}
          </p>
          <p className="text-gray-300">{hovered.nights} night{hovered.nights !== 1 ? "s" : ""} · ₹{hovered.finalAmount.toLocaleString()}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[hovered.status]?.badge ?? ""}`}>
            {STATUS[hovered.status]?.label ?? hovered.status}
          </span>
        </div>
      )}
    </div>
  );
}

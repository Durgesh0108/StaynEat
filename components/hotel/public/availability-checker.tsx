"use client";

import { useState } from "react";
import { Calendar, Search, Users } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/utils/cn";

interface AvailabilityCheckerProps {
  businessId: string;
  onSearch: (checkIn: Date, checkOut: Date) => void;
}

export function AvailabilityChecker({ onSearch }: AvailabilityCheckerProps) {
  const tomorrow = addDays(new Date(), 1);
  const dayAfter = addDays(new Date(), 2);

  const [checkIn, setCheckIn] = useState<string>(format(tomorrow, "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState<string>(format(dayAfter, "yyyy-MM-dd"));
  const [adults, setAdults] = useState(2);

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;
    onSearch(new Date(checkIn), new Date(checkOut));
  };

  return (
    <div className="card p-4 shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="label text-xs">Check-in</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={checkIn}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) {
                  setCheckOut(format(addDays(new Date(e.target.value), 1), "yyyy-MM-dd"));
                }
              }}
              className="input pl-9 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="label text-xs">Check-out</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={checkOut}
              min={checkIn || format(tomorrow, "yyyy-MM-dd")}
              onChange={(e) => setCheckOut(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="label text-xs">Guests</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value))}
              className="input pl-9 text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} Guest{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            <Search className="h-4 w-4" />
            Check Availability
          </button>
        </div>
      </div>
    </div>
  );
}

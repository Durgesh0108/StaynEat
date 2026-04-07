"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Calendar, Users, BedDouble,
  Wifi, Tv, Wind, Coffee, Bath, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowRight, Star,
} from "lucide-react";
import { format, differenceInDays, addDays, isWithinInterval, parseISO, isBefore, startOfDay } from "date-fns";
import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/utils/cn";

const amenityIconMap: Record<string, React.ElementType> = {
  "Free WiFi": Wifi, WiFi: Wifi, TV: Tv, "Air Conditioning": Wind,
  Coffee: Coffee, Bathtub: Bath,
};

const roomTypeBadge: Record<string, string> = {
  SINGLE: "bg-blue-100 text-blue-700",
  DOUBLE: "bg-purple-100 text-purple-700",
  SUITE: "bg-amber-100 text-amber-700",
  DELUXE: "bg-rose-100 text-rose-700",
  PRESIDENTIAL: "bg-primary-100 text-primary-700",
};

interface BookedRange { checkIn: string; checkOut: string; }

interface RoomDetailPageProps {
  business: {
    id: string;
    slug: string;
    name: string;
    logo?: string | null;
    settings?: {
      checkInTime: string;
      checkOutTime: string;
      taxPercentage: number;
      acceptOnlinePayment: boolean;
      acceptOfflinePayment: boolean;
    } | null;
  };
  room: {
    id: string;
    name: string;
    roomNumber: string;
    type: string;
    description?: string | null;
    pricePerNight: number;
    maxOccupancy: number;
    images: string[];
    amenities: string[];
    floor?: number | null;
    isAvailable: boolean;
  };
  bookedRanges: BookedRange[];
  initialCheckIn?: string;
  initialCheckOut?: string;
}

function isDateBooked(date: Date, ranges: BookedRange[]) {
  return ranges.some((r) =>
    isWithinInterval(date, { start: parseISO(r.checkIn), end: addDays(parseISO(r.checkOut), -1) })
  );
}

function rangeOverlapsBooked(checkIn: Date, checkOut: Date, ranges: BookedRange[]) {
  return ranges.some((r) => {
    const rIn = parseISO(r.checkIn);
    const rOut = parseISO(r.checkOut);
    return checkIn < rOut && checkOut > rIn;
  });
}

export function RoomDetailPage({ business, room, bookedRanges, initialCheckIn, initialCheckOut }: RoomDetailPageProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [imageIndex, setImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? today);
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? tomorrow);
  const [availability, setAvailability] = useState<{
    checked: boolean;
    available: boolean | null;
    reason?: string;
    loading: boolean;
  }>({ checked: !!initialCheckIn, available: null, loading: false });

  const images = room.images.length > 0
    ? room.images
    : ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"];

  const nights = differenceInDays(new Date(checkOut), new Date(checkIn)) || 1;
  const taxRate = business.settings?.taxPercentage ?? 18;
  const subtotal = room.pricePerNight * nights;
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  // Check availability whenever dates change
  useEffect(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut) return;

    // Fast client-side check first
    const hasConflict = rangeOverlapsBooked(new Date(checkIn), new Date(checkOut), bookedRanges);
    if (hasConflict || !room.isAvailable) {
      setAvailability({
        checked: true,
        available: false,
        reason: !room.isAvailable ? "Room is currently unavailable" : "Room is already booked for these dates",
        loading: false,
      });
      return;
    }

    // Confirm with server
    setAvailability((p) => ({ ...p, loading: true, checked: false }));
    fetch(`/api/rooms/${room.id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailability({ checked: true, available: data.available, reason: data.reason, loading: false });
      })
      .catch(() => {
        setAvailability({ checked: true, available: null, reason: "Could not verify availability", loading: false });
      });
  }, [checkIn, checkOut, room.id, room.isAvailable, bookedRanges]);

  const handleBook = () => {
    if (!availability.available) return;
    router.push(
      `/h/${business.slug}/book?roomId=${room.id}&checkIn=${new Date(checkIn).toISOString()}&checkOut=${new Date(checkOut).toISOString()}`
    );
  };

  // Build list of unavailable dates for visual hint (not a full calendar)
  const unavailablePeriods = bookedRanges.map((r) => ({
    from: format(parseISO(r.checkIn), "dd MMM"),
    to: format(parseISO(r.checkOut), "dd MMM"),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={`/h/${business.slug}`} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {business.logo && (
            <Image src={business.logo} alt={business.name} width={28} height={28} className="rounded-lg" />
          )}
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{business.name}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Room info */}
          <div className="lg:col-span-3 space-y-5">
            {/* Image gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-72 sm:h-96 group">
              <Image src={images[imageIndex]} alt={room.name} fill className="object-cover" />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={cn("w-2 h-2 rounded-full transition-colors", i === imageIndex ? "bg-white" : "bg-white/50")}
                      />
                    ))}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                    {imageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Room info */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{room.name}</h1>
                  <p className="text-sm text-gray-400">
                    Room {room.roomNumber}
                    {room.floor ? ` · Floor ${room.floor}` : ""}
                    {" · "}
                    <span className={cn("inline-block text-xs font-medium px-2 py-0.5 rounded-full", roomTypeBadge[room.type] ?? "bg-gray-100 text-gray-600")}>
                      {room.type.replace("_", " ")}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(room.pricePerNight)}</p>
                  <p className="text-xs text-gray-400">per night</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Users className="h-4 w-4" />
                <span>Up to {room.maxOccupancy} guests</span>
              </div>

              {room.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{room.description}</p>
              )}

              {/* Amenities */}
              {room.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((a) => {
                      const Icon = amenityIconMap[a];
                      return (
                        <span key={a} className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                          {Icon && <Icon className="h-3.5 w-3.5" />}
                          {a}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Hotel policies */}
            {business.settings && (
              <div className="card p-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Hotel Policies</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 text-primary-500 flex-shrink-0" />
                    <span>Check-in from <strong>{business.settings.checkInTime}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 text-primary-500 flex-shrink-0" />
                    <span>Check-out by <strong>{business.settings.checkOutTime}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Unavailable periods warning */}
            {unavailablePeriods.length > 0 && (
              <div className="card p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Already booked periods (unavailable):
                </p>
                <div className="flex flex-wrap gap-2">
                  {unavailablePeriods.map((p, i) => (
                    <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">
                      {p.from} → {p.to}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking widget */}
          <div className="lg:col-span-2">
            <div className="card p-5 sticky top-20 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Select Dates</h2>

              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={checkIn}
                      min={today}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (e.target.value >= checkOut) {
                          setCheckOut(format(addDays(new Date(e.target.value), 1), "yyyy-MM-dd"));
                        }
                      }}
                      className="input pl-9"
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
                      min={format(addDays(new Date(checkIn), 1), "yyyy-MM-dd")}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="input pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Availability status */}
              {availability.loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking availability...
                </div>
              )}

              {availability.checked && !availability.loading && (
                <div className={cn(
                  "flex items-start gap-2 p-3 rounded-xl text-sm",
                  availability.available === true
                    ? "bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400"
                    : "bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400"
                )}>
                  {availability.available === true
                    ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    : <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  }
                  <span>
                    {availability.available === true
                      ? `Available for ${nights} night${nights !== 1 ? "s" : ""}!`
                      : availability.reason ?? "Not available for these dates"}
                  </span>
                </div>
              )}

              {/* Price breakdown */}
              {nights > 0 && (
                <div className="space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                  <div className="flex justify-between text-gray-500">
                    <span>{formatCurrency(room.pricePerNight)} × {nights} night{nights !== 1 ? "s" : ""}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tax ({taxRate}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-100 dark:border-gray-800">
                    <span>Total</span>
                    <span className="text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              {/* CTA */}
              {!room.isAvailable ? (
                <div className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-center text-sm text-gray-500 font-medium">
                  Room Unavailable (Owner Blocked)
                </div>
              ) : availability.available === false ? (
                <div className="space-y-2">
                  <div className="w-full py-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 text-center text-sm text-danger-600 font-medium">
                    Not available for selected dates
                  </div>
                  <p className="text-xs text-center text-gray-400">Try different check-in / check-out dates</p>
                </div>
              ) : (
                <button
                  onClick={handleBook}
                  disabled={!availability.available || availability.loading}
                  className={cn(
                    "w-full btn-primary py-3 flex items-center justify-center gap-2",
                    (!availability.available && availability.checked) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {availability.loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Checking...</>
                  ) : (
                    <>Book Now <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              )}

              <p className="text-xs text-center text-gray-400">
                Free cancellation · No booking fee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

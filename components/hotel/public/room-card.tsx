"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BedDouble,
  Users,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Bath,
  Phone,
} from "lucide-react";
import { Room } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { calculateNights } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

const amenityIconMap: Record<string, React.ElementType> = {
  WiFi: Wifi,
  TV: Tv,
  "Air Conditioning": Wind,
  Coffee: Coffee,
  Bathtub: Bath,
  Phone: Phone,
};

const roomTypeBadge: Record<string, string> = {
  SINGLE: "bg-blue-50 text-blue-700",
  DOUBLE: "bg-purple-50 text-purple-700",
  SUITE: "bg-amber-50 text-amber-700",
  DELUXE: "bg-rose-50 text-rose-700",
  PRESIDENTIAL: "bg-primary-50 text-primary-700",
};

interface RoomCardProps {
  room: Room;
  businessSlug: string;
  checkIn: Date | null;
  checkOut: Date | null;
  taxPercentage?: number;
}

export function RoomCard({ room, businessSlug, checkIn, checkOut, taxPercentage = 18 }: RoomCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  const images = room.images.length > 0
    ? room.images
    : ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"];

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 1;
  const basePrice = room.pricePerNight * nights;
  const tax = (basePrice * taxPercentage) / 100;
  const total = basePrice + tax;

  const bookingUrl = checkIn && checkOut
    ? `/h/${businessSlug}/book?roomId=${room.id}&checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`
    : `/h/${businessSlug}/rooms/${room.id}`;

  return (
    <div className="card overflow-hidden group hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative w-full sm:w-60 h-48 sm:h-auto flex-shrink-0">
          <Image
            src={images[imageIndex]}
            alt={room.name}
            fill
            className="object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImageIndex((i) => (i - 1 + images.length) % images.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImageIndex((i) => (i + 1) % images.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === imageIndex ? "bg-white" : "bg-white/50")}
                  />
                ))}
              </div>
            </>
          )}
          {!room.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">
                Not Available
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{room.name}</h3>
              <p className="text-xs text-gray-400">Room {room.roomNumber}</p>
            </div>
            <span className={cn("badge text-xs", roomTypeBadge[room.type] ?? "bg-gray-50 text-gray-600")}>
              {room.type.replace("_", " ")}
            </span>
          </div>

          {room.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{room.description}</p>
          )}

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Users className="h-3 w-3" /> Max {room.maxOccupancy} guests
            </span>
            {room.amenities.slice(0, 3).map((amenity) => {
              const AmenityIcon = amenityIconMap[amenity];
              return (
                <span key={amenity} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {AmenityIcon && <AmenityIcon className="h-3 w-3" />}
                  {amenity}
                </span>
              );
            })}
            {room.amenities.length > 3 && (
              <span className="text-xs text-gray-400">+{room.amenities.length - 3} more</span>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(room.pricePerNight)}
                </span>
                <span className="text-xs text-gray-400">/night</span>
              </div>
              {nights > 1 && (
                <p className="text-xs text-gray-400">
                  {nights} nights · {formatCurrency(total)} total (incl. tax)
                </p>
              )}
            </div>
            <Link
              href={bookingUrl}
              className={cn(
                "btn-primary text-sm py-2 px-4",
                !room.isAvailable && "opacity-50 pointer-events-none bg-gray-400"
              )}
            >
              {room.isAvailable ? "Book Now" : "Unavailable"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

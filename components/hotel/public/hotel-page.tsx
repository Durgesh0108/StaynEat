"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Wifi,
  Coffee,
  Car,
  Dumbbell,
  Waves,
  Utensils,
  ChevronRight,
  Calendar,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { Room, MenuItem, Review } from "@/types";
import { RoomCard } from "@/components/hotel/public/room-card";
import { AvailabilityChecker } from "@/components/hotel/public/availability-checker";
import { ReviewCard } from "@/components/shared/review-card";
import { motion } from "framer-motion";

interface Business {
  id: string;
  slug: string;
  name: string;
  type: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  rooms: Room[];
  menuItems: MenuItem[];
  reviews: Review[];
  settings?: {
    checkInTime: string;
    checkOutTime: string;
    taxPercentage: number;
    foodModuleEnabled: boolean;
    acceptOnlinePayment: boolean;
    acceptOfflinePayment: boolean;
  } | null;
}

interface HotelPublicPageProps {
  business: Business;
  avgRating: number;
  reviewCount: number;
}

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi,
  "Free WiFi": Wifi,
  "Swimming Pool": Waves,
  Gym: Dumbbell,
  Restaurant: Utensils,
  Parking: Car,
  Breakfast: Coffee,
};

export function HotelPublicPage({ business, avgRating, reviewCount }: HotelPublicPageProps) {
  const [activeTab, setActiveTab] = useState<"rooms" | "menu" | "reviews">("rooms");
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  const hasFoodModule = business.settings?.foodModuleEnabled && business.menuItems.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            {business.logo && (
              <Image src={business.logo} alt={business.name} width={32} height={32} className="rounded-lg object-cover" />
            )}
            <span className="font-semibold text-gray-900 dark:text-white">{business.name}</span>
          </div>
          <div className="flex items-center gap-4">
            {hasFoodModule && (
              <Link href={`/h/${business.slug}/menu`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">
                Food Menu
              </Link>
            )}
            <a href="#rooms" className="btn-primary text-sm py-2 px-4">
              Book a Room
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[600px]">
        {business.coverImage ? (
          <Image
            src={business.coverImage}
            alt={business.name}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{business.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
              {business.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {business.address ? `${business.address}, ` : ""}{business.city}
                  {business.state ? `, ${business.state}` : ""}
                </span>
              )}
              {reviewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <strong>{avgRating.toFixed(1)}</strong>
                  <span className="opacity-70">({reviewCount} reviews)</span>
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Availability Checker */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <AvailabilityChecker
          businessId={business.id}
          onSearch={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {business.description && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">About</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{business.description}</p>
              </div>
            )}

            {/* Tabs */}
            <div>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                {[
                  { id: "rooms", label: `Rooms (${business.rooms.length})` },
                  ...(hasFoodModule ? [{ id: "menu", label: "Food Menu" }] : []),
                  ...(reviewCount > 0 ? [{ id: "reviews", label: `Reviews (${reviewCount})` }] : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "rooms" && (
                <div id="rooms" className="space-y-4">
                  {business.rooms.length === 0 ? (
                    <p className="text-center text-gray-400 py-12">No rooms available</p>
                  ) : (
                    business.rooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        businessSlug={business.slug}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        taxPercentage={business.settings?.taxPercentage ?? 18}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "menu" && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">View our full food menu</p>
                  <Link href={`/h/${business.slug}/menu`} className="btn-primary inline-flex items-center gap-2">
                    View Menu <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {business.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Info Card */}
          <div className="space-y-4">
            <div className="card p-5 sticky top-20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Property Info</h3>
              <div className="space-y-3 text-sm">
                {business.settings && (
                  <>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-primary-500" />
                      <span>Check-in: <strong>{business.settings.checkInTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-primary-500" />
                      <span>Check-out: <strong>{business.settings.checkOutTime}</strong></span>
                    </div>
                  </>
                )}
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
                    <Phone className="h-4 w-4 flex-shrink-0 text-primary-500" />
                    <span>{business.phone}</span>
                  </a>
                )}
                {business.email && (
                  <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
                    <Mail className="h-4 w-4 flex-shrink-0 text-primary-500" />
                    <span className="truncate">{business.email}</span>
                  </a>
                )}
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
                    <Globe className="h-4 w-4 flex-shrink-0 text-primary-500" />
                    <span className="truncate">Website</span>
                  </a>
                )}
              </div>

              {business.settings?.acceptOnlinePayment && (
                <div className="mt-4 p-3 bg-success-50 dark:bg-green-950 rounded-xl">
                  <p className="text-xs font-medium text-success-700 dark:text-green-400">
                    ✓ Online payments accepted
                  </p>
                </div>
              )}

              {hasFoodModule && (
                <Link
                  href={`/h/${business.slug}/order`}
                  className="mt-4 flex items-center justify-between p-3 bg-accent-50 dark:bg-amber-950 rounded-xl hover:bg-accent-100 dark:hover:bg-amber-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-accent-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-accent-700 dark:text-amber-300">Order Room Service</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-accent-500" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardStats } from "@/components/dashboard/stats";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorCard } from "@/components/ui/error-card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/admin");

  let business = null;
  try {
    business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: {
        settings: true,
        rooms: { where: { isActive: true }, select: { id: true } },
        menuItems: { where: { isActive: true }, select: { id: true } },
        tables: { where: { isActive: true }, select: { id: true } },
      },
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    return <ErrorCard message="Unable to load dashboard. Please check your database connection." className="m-6" />;
  }

  if (!business) redirect("/register");

  const isHotel = business.type === "HOTEL" || business.type === "BOTH";
  const isRestaurant = business.type === "RESTAURANT" || business.type === "BOTH";

  const showChecklist =
    !business.logo ||
    business.rooms.length === 0 ||
    (isRestaurant && business.menuItems.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good morning, {session.user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Here's what's happening with {business.name} today.
        </p>
      </div>

      {/* Onboarding Checklist */}
      {showChecklist && (
        <OnboardingChecklist
          businessId={business.id}
          businessType={business.type}
          hasLogo={!!business.logo}
          hasRooms={business.rooms.length > 0}
          hasMenuItems={isRestaurant && business.menuItems.length > 0}
          hasTables={isRestaurant && business.tables.length > 0}
          slug={business.slug}
        />
      )}

      {/* Stats */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats businessId={business.id} businessType={business.type} />
      </Suspense>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div className="card h-80 animate-pulse" />}>
          <RevenueChart businessId={business.id} />
        </Suspense>

        {isHotel && (
          <Suspense fallback={<div className="card h-80 animate-pulse" />}>
            <RecentBookings businessId={business.id} />
          </Suspense>
        )}

        {isRestaurant && (
          <Suspense fallback={<div className="card h-80 animate-pulse" />}>
            <RecentOrders businessId={business.id} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

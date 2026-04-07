import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorCard } from "@/components/ui/error-card";
import { formatCurrency } from "@/utils/formatCurrency";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

interface DashboardStatsProps {
  businessId: string;
  businessType: string;
}

export async function DashboardStats({ businessId, businessType }: DashboardStatsProps) {
  const isHotel = businessType === "HOTEL" || businessType === "BOTH";
  const isRestaurant = businessType === "RESTAURANT" || businessType === "BOTH";

  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);

  try {
    const [
      bookingsToday,
      checkInsToday,
      checkOutsToday,
      pendingBookings,
      revenueToday,
      revenueMonth,
      ordersToday,
      pendingOrders,
      totalRooms,
      occupiedRooms,
    ] = await Promise.all([
      isHotel
        ? prisma.booking.count({
            where: { businessId, createdAt: { gte: startToday, lte: endToday } },
          })
        : Promise.resolve(0),
      isHotel
        ? prisma.booking.count({
            where: { businessId, checkIn: { gte: startToday, lte: endToday }, status: "CONFIRMED" },
          })
        : Promise.resolve(0),
      isHotel
        ? prisma.booking.count({
            where: { businessId, checkOut: { gte: startToday, lte: endToday }, status: "CHECKED_OUT" },
          })
        : Promise.resolve(0),
      isHotel
        ? prisma.booking.count({ where: { businessId, status: "PENDING" } })
        : Promise.resolve(0),
      prisma.booking.aggregate({
        where: {
          businessId,
          paymentStatus: "PAID",
          createdAt: { gte: startToday, lte: endToday },
        },
        _sum: { finalAmount: true },
      }),
      prisma.booking.aggregate({
        where: {
          businessId,
          paymentStatus: "PAID",
          createdAt: { gte: startMonth, lte: endMonth },
        },
        _sum: { finalAmount: true },
      }),
      isRestaurant
        ? prisma.order.count({
            where: { businessId, createdAt: { gte: startToday, lte: endToday } },
          })
        : Promise.resolve(0),
      isRestaurant
        ? prisma.order.count({ where: { businessId, status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } } })
        : Promise.resolve(0),
      isHotel
        ? prisma.room.count({ where: { businessId, isActive: true } })
        : Promise.resolve(0),
      isHotel
        ? prisma.booking.count({
            where: {
              businessId,
              status: "CHECKED_IN",
              checkIn: { lte: today },
              checkOut: { gte: today },
            },
          })
        : Promise.resolve(0),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const revToday = revenueToday._sum.finalAmount ?? 0;
    const revMonth = revenueMonth._sum.finalAmount ?? 0;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isHotel && (
          <>
            <StatCard
              icon="CalendarCheck"
              label="Bookings Today"
              value={bookingsToday}
              trendLabel="new today"
              iconColor="text-blue-600"
              iconBg="bg-blue-50 dark:bg-blue-950"
            />
            <StatCard
              icon="BedDouble"
              label="Occupancy Rate"
              value={`${occupancyRate}%`}
              trendLabel={`${occupiedRooms}/${totalRooms} rooms`}
              iconColor="text-primary-600"
              iconBg="bg-primary-50 dark:bg-primary-950"
            />
            <StatCard
              icon="Clock"
              label="Pending Bookings"
              value={pendingBookings}
              trendLabel="need attention"
              iconColor="text-amber-600"
              iconBg="bg-amber-50 dark:bg-amber-950"
            />
          </>
        )}

        {isRestaurant && (
          <>
            <StatCard
              icon="Utensils"
              label="Orders Today"
              value={ordersToday}
              trendLabel="total orders"
              iconColor="text-orange-600"
              iconBg="bg-orange-50 dark:bg-orange-950"
            />
            <StatCard
              icon="ShoppingBag"
              label="Active Orders"
              value={pendingOrders}
              trendLabel="in progress"
              iconColor="text-purple-600"
              iconBg="bg-purple-50 dark:bg-purple-950"
            />
          </>
        )}

        <StatCard
          icon="TrendingUp"
          label="Revenue Today"
          value={formatCurrency(revToday)}
          trendLabel="today"
          iconColor="text-success-600"
          iconBg="bg-success-50 dark:bg-green-950"
        />
        <StatCard
          icon="DollarSign"
          label="Revenue This Month"
          value={formatCurrency(revMonth)}
          trendLabel="this month"
          iconColor="text-success-600"
          iconBg="bg-success-50 dark:bg-green-950"
        />
        {isHotel && (
          <StatCard
            icon="Users"
            label="Check-ins Today"
            value={`${checkInsToday} in / ${checkOutsToday} out`}
            trendLabel="today"
            iconColor="text-teal-600"
            iconBg="bg-teal-50 dark:bg-teal-950"
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("Stats fetch error:", error);
    return <ErrorCard message="Unable to load statistics. Please try refreshing." compact />;
  }
}

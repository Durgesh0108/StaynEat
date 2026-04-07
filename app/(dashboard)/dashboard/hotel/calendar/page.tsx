export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OccupancyCalendar } from "@/components/hotel/admin/occupancy-calendar";
import { ErrorCard } from "@/components/ui/error-card";

export default async function HotelCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, type: true },
    });
    if (!business || (business.type !== "HOTEL" && business.type !== "BOTH")) redirect("/dashboard");

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const [rooms, bookings] = await Promise.all([
      prisma.room.findMany({
        where: { businessId: business.id, isActive: true },
        select: { id: true, name: true, type: true },
        orderBy: { name: "asc" },
      }),
      prisma.booking.findMany({
        where: {
          businessId: business.id,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          checkIn: { lte: endDate },
          checkOut: { gte: startDate },
        },
        select: {
          id: true,
          roomId: true,
          guestName: true,
          checkIn: true,
          checkOut: true,
          status: true,
        },
      }),
    ]);

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Occupancy Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Room availability overview</p>
        </div>
        <OccupancyCalendar rooms={rooms} bookings={bookings} />
      </div>
    );
  } catch (err) {
    console.error("Calendar page error:", err);
    return <ErrorCard message="Unable to load calendar." className="mt-6" />;
  }
}

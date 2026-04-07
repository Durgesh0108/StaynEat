import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookingsManagement } from "@/components/hotel/admin/bookings-management";
import { ErrorCard } from "@/components/ui/error-card";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) redirect("/dashboard");

    const bookings = await prisma.booking.findMany({
      where: { businessId: business.id },
      include: {
        room: { select: { name: true, roomNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all hotel reservations</p>
        </div>
        <BookingsManagement
          businessId={business.id}
          initialBookings={bookings as Parameters<typeof BookingsManagement>[0]["initialBookings"]}
        />
      </div>
    );
  } catch (err) {
    console.error("Bookings page error:", err);
    return <ErrorCard message="Unable to load bookings." className="mt-6" />;
  }
}

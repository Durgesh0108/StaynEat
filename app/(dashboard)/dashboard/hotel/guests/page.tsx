export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GuestsClient } from "@/components/hotel/admin/guests-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function HotelGuestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, type: true },
    });
    if (!business || (business.type !== "HOTEL" && business.type !== "BOTH")) redirect("/dashboard");

    const bookings = await prisma.booking.findMany({
      where: { businessId: business.id },
      include: { room: { select: { roomNumber: true, name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All guests and booking history</p>
        </div>
        <GuestsClient
          bookings={bookings.map((b) => ({
            ...b,
            checkIn: b.checkIn.toISOString(),
            checkOut: b.checkOut.toISOString(),
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      </div>
    );
  } catch (err) {
    console.error("Guests page error:", err);
    return <ErrorCard message="Unable to load guests." className="mt-6" />;
  }
}

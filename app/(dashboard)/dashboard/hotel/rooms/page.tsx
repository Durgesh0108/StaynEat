export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RoomsManagement } from "@/components/hotel/admin/rooms-management";
import { ErrorCard } from "@/components/ui/error-card";

export default async function HotelRoomsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, slug: true },
    });

    if (!business) redirect("/dashboard");

    const rooms = await prisma.room.findMany({
      where: { businessId: business.id },
      orderBy: { roomNumber: "asc" },
      include: { qrCodes: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rooms</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your hotel rooms, availability and room-service QR codes</p>
        </div>
        <RoomsManagement
          businessId={business.id}
          businessSlug={business.slug}
          initialRooms={rooms.map((r) => ({ ...r, qrCode: r.qrCodes[0] ?? null })) as Parameters<typeof RoomsManagement>[0]["initialRooms"]}
        />
      </div>
    );
  } catch (err) {
    console.error("Rooms page error:", err);
    return <ErrorCard message="Unable to load rooms. Please try again." className="mt-6" />;
  }
}

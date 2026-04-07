export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoomDetailPage } from "@/components/hotel/public/room-detail-page";

interface Props {
  params: { slug: string; roomId: string };
  searchParams: { checkIn?: string; checkOut?: string };
}

export default async function RoomPage({ params, searchParams }: Props) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { settings: true },
  });
  if (!business) notFound();

  const room = await prisma.room.findFirst({
    where: { id: params.roomId, businessId: business.id, isActive: true },
  });
  if (!room) notFound();

  // Fetch booked date ranges for this room so the UI can block those dates
  const bookings = await prisma.booking.findMany({
    where: {
      roomId: room.id,
      status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      checkOut: { gte: new Date() },
    },
    select: { checkIn: true, checkOut: true },
    orderBy: { checkIn: "asc" },
  });

  return (
    <RoomDetailPage
      business={{
        id: business.id,
        slug: business.slug,
        name: business.name,
        logo: business.logo,
        settings: business.settings
          ? {
              checkInTime: business.settings.checkInTime,
              checkOutTime: business.settings.checkOutTime,
              taxPercentage: business.settings.taxPercentage,
              acceptOnlinePayment: business.settings.acceptOnlinePayment,
              acceptOfflinePayment: business.settings.acceptOfflinePayment,
            }
          : null,
      }}
      room={{
        id: room.id,
        name: room.name,
        roomNumber: room.roomNumber,
        type: room.type,
        description: room.description,
        pricePerNight: room.pricePerNight,
        maxOccupancy: room.maxOccupancy,
        images: room.images,
        amenities: room.amenities,
        floor: room.floor,
        isAvailable: room.isAvailable,
      }}
      bookedRanges={bookings.map((b) => ({
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
      }))}
      initialCheckIn={searchParams.checkIn}
      initialCheckOut={searchParams.checkOut}
    />
  );
}

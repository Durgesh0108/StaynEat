export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HotelCheckoutClient } from "@/components/hotel/public/hotel-checkout-client";

interface Props {
  params: { slug: string };
  searchParams: { room?: string };
}

export default async function HotelCheckoutPage({ params, searchParams }: Props) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { settings: true },
  });
  if (!business) notFound();

  let room = null;
  if (searchParams.room) {
    room = await prisma.room.findFirst({
      where: { businessId: business.id, roomNumber: searchParams.room, isActive: true },
      select: { id: true, roomNumber: true, name: true },
    });
  }

  return (
    <HotelCheckoutClient
      business={{
        id: business.id,
        slug: business.slug,
        name: business.name,
        settings: business.settings
          ? {
              taxPercentage: business.settings.taxPercentage,
              acceptOnlinePayment: business.settings.acceptOnlinePayment,
              acceptOfflinePayment: business.settings.acceptOfflinePayment,
            }
          : null,
      }}
      room={room}
    />
  );
}

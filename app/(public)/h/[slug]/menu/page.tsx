export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HotelRoomMenuPage } from "@/components/hotel/public/room-menu-page";

interface Props {
  params: { slug: string };
  searchParams: { room?: string };
}

export default async function HotelMenuPage({ params, searchParams }: Props) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      settings: true,
      menuItems: {
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!business) notFound();

  let room = null;
  if (searchParams.room) {
    room = await prisma.room.findFirst({
      where: { businessId: business.id, roomNumber: searchParams.room, isActive: true },
      select: { id: true, roomNumber: true, name: true, floor: true },
    });
  }

  return (
    <HotelRoomMenuPage
      business={{
        id: business.id,
        slug: business.slug,
        name: business.name,
        logo: business.logo,
        settings: business.settings
          ? {
              taxPercentage: business.settings.taxPercentage,
              acceptOnlinePayment: business.settings.acceptOnlinePayment,
              acceptOfflinePayment: business.settings.acceptOfflinePayment,
            }
          : null,
        menuItems: business.menuItems,
      }}
      initialRoom={room}
    />
  );
}

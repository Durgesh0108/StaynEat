export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionBillClient } from "@/components/shared/session-bill-client";

interface Props {
  params: { slug: string };
  searchParams: { session?: string; room?: string };
}

export default async function HotelBillPage({ params, searchParams }: Props) {
  if (!searchParams.session) notFound();

  const business = await prisma.business.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { settings: true },
  });
  if (!business) notFound();

  return (
    <SessionBillClient
      sessionId={searchParams.session}
      businessId={business.id}
      businessName={business.name}
      businessSlug={business.slug}
      context="hotel"
      roomNumber={searchParams.room}
      settings={business.settings ? {
        acceptOnlinePayment: business.settings.acceptOnlinePayment,
        acceptOfflinePayment: business.settings.acceptOfflinePayment,
      } : null}
    />
  );
}

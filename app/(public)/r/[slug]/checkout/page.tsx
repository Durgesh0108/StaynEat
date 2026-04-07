import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "@/components/restaurant/public/checkout-client";

export const dynamic = "force-dynamic";

interface Props { params: { slug: string } }

export default async function CheckoutPage({ params }: Props) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: { settings: true },
  });
  if (!business) notFound();

  return <CheckoutClient business={business} />;
}

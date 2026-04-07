import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HotelPublicPage } from "@/components/hotel/public/hotel-page";
import { ErrorCard } from "@/components/ui/error-card";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      select: { name: true, description: true, city: true, logo: true },
    });
    if (!business) return { title: "Hotel Not Found" };
    return {
      title: `${business.name} — Book Online`,
      description: business.description ?? `Book rooms at ${business.name} in ${business.city}`,
      openGraph: { images: business.logo ? [business.logo] : [] },
    };
  } catch {
    return { title: "Hotel" };
  }
}

export default async function HotelPage({ params }: Props) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug, isActive: true },
      include: {
        settings: true,
        rooms: {
          where: { isActive: true },
          orderBy: { pricePerNight: "asc" },
        },
        menuItems: {
          where: { isActive: true, isAvailable: true },
          orderBy: { category: "asc" },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { reviews: { where: { isApproved: true } } },
        },
      },
    });

    if (!business) notFound();

    const avgRating =
      business.reviews.length > 0
        ? business.reviews.reduce((sum, r) => sum + r.rating, 0) / business.reviews.length
        : 0;

    return (
      <HotelPublicPage
        business={business as Parameters<typeof HotelPublicPage>[0]["business"]}
        avgRating={avgRating}
        reviewCount={business._count.reviews}
      />
    );
  } catch (error) {
    console.error("Hotel page error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorCard message="Unable to load hotel page. Please try again later." />
      </div>
    );
  }
}

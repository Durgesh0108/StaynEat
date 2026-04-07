import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Star, QrCode, Globe, Clock } from "lucide-react";
import { ErrorCard } from "@/components/ui/error-card";

export const revalidate = 60;

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const business = await prisma.business.findUnique({ where: { slug: params.slug }, select: { name: true, description: true } });
  return {
    title: business?.name ?? "Restaurant",
    description: business?.description ?? undefined,
  };
}

export default async function RestaurantPage({ params }: Props) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      include: {
        settings: true,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        tables: { where: { isActive: true }, select: { id: true, tableNumber: true, capacity: true } },
        _count: { select: { reviews: true } },
      },
    });

    if (!business || (business.type !== "RESTAURANT" && business.type !== "BOTH")) notFound();

    const avgRating = business.reviews.length > 0
      ? business.reviews.reduce((s, r) => s + r.rating, 0) / business.reviews.length
      : 0;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Hero */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          {business.coverImage ? (
            <Image src={business.coverImage} alt={business.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent-500 to-primary-600" />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end gap-4">
              {business.logo && (
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-lg shrink-0">
                  <Image src={business.logo} alt={business.name} width={64} height={64} className="object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{business.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {avgRating > 0 && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span className="text-white font-medium">{avgRating.toFixed(1)}</span>
                      <span className="text-gray-300 text-sm">({business._count.reviews})</span>
                    </div>
                  )}
                  {business.city && (
                    <div className="flex items-center gap-1 text-gray-300 text-sm">
                      <MapPin className="h-3.5 w-3.5" /> {business.city}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* CTA */}
          {business.settings?.foodModuleEnabled && (
            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/r/${params.slug}/menu`}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                View Menu & Order
              </Link>
              {business.settings.onlineOrderingEnabled && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <QrCode className="h-4 w-4" />
                  Scan QR on your table to order
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* About */}
              {business.description && (
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-2">About</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{business.description}</p>
                </div>
              )}

              {/* Reviews */}
              {business.reviews.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Reviews ({business._count.reviews})
                  </h2>
                  <div className="space-y-3">
                    {business.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {review.guestName}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>}
                        {review.ownerReply && (
                          <div className="mt-2 pl-3 border-l-2 border-primary-200 dark:border-primary-700">
                            <p className="text-xs text-primary-600 font-medium">Owner reply</p>
                            <p className="text-xs text-gray-500">{review.ownerReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Contact & Info</h2>
                {business.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <span>{business.address}{business.city ? `, ${business.city}` : ""}</span>
                  </div>
                )}
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500">
                    <Phone className="h-4 w-4 text-gray-400" /> {business.phone}
                  </a>
                )}
                {business.email && (
                  <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500">
                    <Mail className="h-4 w-4 text-gray-400" /> {business.email}
                  </a>
                )}
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
              </div>

              {business.tables.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-500" /> Tables Available
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {business.tables.map((t) => (
                      <Link
                        key={t.id}
                        href={`/r/${params.slug}/menu?table=${t.id}`}
                        className="aspect-square border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer"
                      >
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{t.tableNumber}</span>
                        <span className="text-xs text-gray-400">{t.capacity} seats</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800 mt-8">
          Powered by{" "}
          <a href="/" className="text-primary-500 font-semibold">HospitPro</a>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Restaurant page error:", err);
    return <ErrorCard message="Unable to load restaurant page." className="m-8" />;
  }
}

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReviewsClient } from "@/components/dashboard/reviews-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) redirect("/dashboard");

    const reviews = await prisma.review.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    });

    const avgRating =
      reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {reviews.length} reviews · {avgRating.toFixed(1)} avg rating
          </p>
        </div>
        <ReviewsClient reviews={reviews} businessId={business.id} />
      </div>
    );
  } catch (err) {
    console.error("Reviews page error:", err);
    return <ErrorCard message="Unable to load reviews." className="mt-6" />;
  }
}

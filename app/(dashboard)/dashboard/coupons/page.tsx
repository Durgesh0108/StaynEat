import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CouponsClient } from "@/components/dashboard/coupons-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) redirect("/dashboard");

    const coupons = await prisma.coupon.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage discount coupons</p>
        </div>
        <CouponsClient businessId={business.id} initialCoupons={coupons} />
      </div>
    );
  } catch (err) {
    console.error("Coupons page error:", err);
    return <ErrorCard message="Unable to load coupons." className="mt-6" />;
  }
}

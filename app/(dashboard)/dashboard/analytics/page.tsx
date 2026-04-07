export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/dashboard/analytics-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, type: true },
    });
    if (!business) redirect("/dashboard");

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Insights and trends for your business</p>
        </div>
        <AnalyticsClient businessId={business.id} businessType={business.type} />
      </div>
    );
  } catch (err) {
    console.error("Analytics page error:", err);
    return <ErrorCard message="Unable to load analytics." className="mt-6" />;
  }
}

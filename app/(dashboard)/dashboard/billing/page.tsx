import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BillingClient } from "@/components/dashboard/billing-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialEndsAt: true,
      },
    });
    if (!business) redirect("/dashboard");

    return (
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your subscription plan and payment history</p>
        </div>
        <BillingClient business={business} />
      </div>
    );
  } catch (err) {
    console.error("Billing page error:", err);
    return <ErrorCard message="Unable to load billing information." className="mt-6" />;
  }
}

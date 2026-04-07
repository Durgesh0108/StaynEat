export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin/dashboard";
import { ErrorCard } from "@/components/ui/error-card";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  try {
    const [
      totalBusinesses,
      activeSubscriptions,
      trialBusinesses,
      totalBookings,
      totalOrders,
      recentSignups,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.business.count({ where: { subscriptionStatus: "TRIAL" } }),
      prisma.booking.count(),
      prisma.order.count(),
      prisma.business.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { owner: { select: { name: true, email: true } } },
      }),
      prisma.subscription.aggregate({
        where: { status: "ACTIVE" },
        _sum: { amount: true },
      }),
    ]);

    const mrr = (monthlyRevenue._sum.amount ?? 0);

    return (
      <AdminDashboard
        stats={{
          totalBusinesses,
          activeSubscriptions,
          trialBusinesses,
          mrr,
          arr: mrr * 12,
          totalBookings,
          totalOrders,
          expiredSubscriptions: 0,
          newSignupsToday: 0,
          newSignupsThisMonth: 0,
          totalRevenue: mrr,
        }}
        recentSignups={recentSignups as Parameters<typeof AdminDashboard>[0]["recentSignups"]}
      />
    );
  } catch (err) {
    console.error("Admin dashboard error:", err);
    return <ErrorCard message="Unable to load admin dashboard." className="mt-6" />;
  }
}

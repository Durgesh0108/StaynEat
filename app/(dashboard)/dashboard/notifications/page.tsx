export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/dashboard/notifications-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) redirect("/dashboard");

    const notifications = await prisma.notification.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return (
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Activity and alerts for your business</p>
        </div>
        <NotificationsClient
          businessId={business.id}
          initialNotifications={notifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
    );
  } catch (err) {
    console.error("Notifications page error:", err);
    return <ErrorCard message="Unable to load notifications." className="mt-6" />;
  }
}

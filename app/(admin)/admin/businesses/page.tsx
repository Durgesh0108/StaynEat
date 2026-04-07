export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminBusinessesClient } from "@/components/admin/businesses-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function AdminBusinessesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  try {
    const businesses = await prisma.business.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { rooms: true, menuItems: true, bookings: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Businesses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{businesses.length} registered businesses</p>
        </div>
        <AdminBusinessesClient businesses={businesses} />
      </div>
    );
  } catch (err) {
    console.error("Admin businesses error:", err);
    return <ErrorCard message="Unable to load businesses." />;
  }
}

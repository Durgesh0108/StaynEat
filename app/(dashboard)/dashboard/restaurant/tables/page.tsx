export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TablesManagement } from "@/components/restaurant/admin/tables-management";
import { ErrorCard } from "@/components/ui/error-card";

export default async function TablesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, slug: true, type: true },
    });
    if (!business) redirect("/dashboard");

    const tables = await prisma.table.findMany({
      where: { businessId: business.id },
      include: { qrCode: true },
      orderBy: { tableNumber: "asc" },
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tables & QR Codes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage tables and generate QR codes for ordering</p>
        </div>
        <TablesManagement
          businessId={business.id}
          businessSlug={business.slug}
          initialTables={tables as Parameters<typeof TablesManagement>[0]["initialTables"]}
        />
      </div>
    );
  } catch (err) {
    console.error("Tables page error:", err);
    return <ErrorCard message="Unable to load tables." className="mt-6" />;
  }
}

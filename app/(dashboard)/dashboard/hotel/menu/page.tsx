import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MenuManagement } from "@/components/restaurant/admin/menu-management";
import { ErrorCard } from "@/components/ui/error-card";

export default async function HotelMenuPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, type: true },
    });
    if (!business || (business.type !== "HOTEL" && business.type !== "BOTH")) redirect("/dashboard");

    const menuItems = await prisma.menuItem.findMany({
      where: { businessId: business.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Service Menu</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your in-room dining menu</p>
        </div>
        <MenuManagement businessId={business.id} initialItems={menuItems} />
      </div>
    );
  } catch (err) {
    console.error("Hotel menu page error:", err);
    return <ErrorCard message="Unable to load menu." className="mt-6" />;
  }
}

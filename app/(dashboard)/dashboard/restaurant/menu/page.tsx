import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MenuManagement } from "@/components/restaurant/admin/menu-management";
import { ErrorCard } from "@/components/ui/error-card";

export default async function RestaurantMenuPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) redirect("/dashboard");

    const menuItems = await prisma.menuItem.findMany({
      where: { businessId: business.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add and manage your restaurant menu items</p>
        </div>
        <MenuManagement
          businessId={business.id}
          initialItems={menuItems as Parameters<typeof MenuManagement>[0]["initialItems"]}
        />
      </div>
    );
  } catch (err) {
    console.error("Menu page error:", err);
    return <ErrorCard message="Unable to load menu." className="mt-6" />;
  }
}

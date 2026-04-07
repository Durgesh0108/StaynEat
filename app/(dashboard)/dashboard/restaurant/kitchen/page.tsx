import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { KitchenDisplay } from "@/components/restaurant/admin/kitchen-display";
import { ErrorCard } from "@/components/ui/error-card";

export default async function KitchenPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
    });
    if (!business) redirect("/dashboard");

    const orders = await prisma.order.findMany({
      where: {
        businessId: business.id,
        status: { in: ["CONFIRMED", "PREPARING"] },
      },
      include: {
        table: { select: { tableNumber: true } },
        items: {
          include: { menuItem: { select: { name: true, isVeg: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return (
      <KitchenDisplay
        businessId={business.id}
        businessName={business.name}
        initialOrders={orders as Parameters<typeof KitchenDisplay>[0]["initialOrders"]}
      />
    );
  } catch (err) {
    console.error("Kitchen display error:", err);
    return <ErrorCard message="Unable to load kitchen display." className="mt-6" />;
  }
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrdersBoard } from "@/components/restaurant/admin/orders-board";
import { ErrorCard } from "@/components/ui/error-card";

export default async function RestaurantOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) redirect("/dashboard");

    const orders = await prisma.order.findMany({
      where: { businessId: business.id },
      include: {
        table: { select: { tableNumber: true } },
        items: {
          include: { menuItem: { select: { name: true, price: true, isVeg: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Live orders board with real-time updates</p>
        </div>
        <OrdersBoard
          businessId={business.id}
          initialOrders={orders as Parameters<typeof OrdersBoard>[0]["initialOrders"]}
        />
      </div>
    );
  } catch (err) {
    console.error("Orders page error:", err);
    return <ErrorCard message="Unable to load orders." className="mt-6" />;
  }
}

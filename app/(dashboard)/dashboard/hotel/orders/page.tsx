export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrdersBoard } from "@/components/restaurant/admin/orders-board";
import { ErrorCard } from "@/components/ui/error-card";

export default async function HotelOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, type: true },
    });
    if (!business || (business.type !== "HOTEL" && business.type !== "BOTH")) redirect("/dashboard");

    const orders = await prisma.order.findMany({
      where: {
        businessId: business.id,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      include: {
        items: { include: { menuItem: { select: { name: true, isVeg: true } } } },
        table: { select: { tableNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Service Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage active room service orders</p>
        </div>
        <OrdersBoard businessId={business.id} initialOrders={orders} />
      </div>
    );
  } catch (err) {
    console.error("Hotel orders page error:", err);
    return <ErrorCard message="Unable to load orders." className="mt-6" />;
  }
}

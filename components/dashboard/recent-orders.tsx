import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorCard } from "@/components/ui/error-card";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatTimeAgo } from "@/utils/formatDate";
import { ArrowRight } from "lucide-react";

export async function RecentOrders({ businessId }: { businessId: string }) {
  try {
    const orders = await prisma.order.findMany({
      where: { businessId },
      include: {
        table: { select: { tableNumber: true } },
        items: { include: { menuItem: { select: { name: true } } }, take: 2 },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
          <Link
            href="/dashboard/restaurant/orders"
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-accent-50 dark:bg-amber-950 text-accent-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {o.table?.tableNumber ?? "RS"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {o.guestName ?? `Table ${o.table?.tableNumber}`}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {o.items.slice(0, 2).map((i) => i.menuItem?.name).join(", ")}
                    {o.items.length > 2 && ` +${o.items.length - 2} more`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(o.totalAmount)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return <ErrorCard compact message="Unable to load recent orders." />;
  }
}

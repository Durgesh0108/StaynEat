import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorCard } from "@/components/ui/error-card";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { ArrowRight } from "lucide-react";

export async function RecentBookings({ businessId }: { businessId: string }) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { businessId },
      include: { room: { select: { name: true, roomNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
          <Link
            href="/dashboard/hotel/bookings"
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No bookings yet</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {b.guestName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.guestName}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {b.room?.name} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(b.finalAmount)}</p>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return <ErrorCard compact message="Unable to load recent bookings." />;
  }
}

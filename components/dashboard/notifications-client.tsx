"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import {
  Bell,
  ShoppingBag,
  CalendarRange,
  CreditCard,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  NEW_ORDER: ShoppingBag,
  ORDER_READY: CheckCircle,
  NEW_BOOKING: CalendarRange,
  BOOKING_CONFIRMED: CheckCircle,
  BOOKING_CANCELLED: AlertCircle,
  PAYMENT_RECEIVED: CreditCard,
  REVIEW_POSTED: Star,
  SUBSCRIPTION_EXPIRING: AlertCircle,
  SUBSCRIPTION_EXPIRED: AlertCircle,
  SYSTEM: Info,
};

const TYPE_COLOR: Record<string, string> = {
  NEW_ORDER: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  ORDER_READY: "bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400",
  NEW_BOOKING: "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400",
  BOOKING_CONFIRMED: "bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400",
  BOOKING_CANCELLED: "bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400",
  PAYMENT_RECEIVED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  REVIEW_POSTED: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  SUBSCRIPTION_EXPIRING: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  SUBSCRIPTION_EXPIRED: "bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400",
  SYSTEM: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export function NotificationsClient({
  businessId,
  initialNotifications,
}: {
  businessId: string;
  initialNotifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update notifications");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  };

  if (notifications.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <Bell className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
        <p className="text-sm text-gray-400 mt-1">Activity like new orders and bookings will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={markAllRead}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      )}

      <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {notifications.map((n) => {
          const Icon = TYPE_ICON[n.type] ?? Bell;
          const colorClass = TYPE_COLOR[n.type] ?? TYPE_COLOR.SYSTEM;

          return (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={cn(
                "flex items-start gap-4 px-5 py-4 transition-colors",
                !n.isRead
                  ? "bg-primary-50/50 dark:bg-primary-950/20 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm font-medium", n.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white")}>
                    {n.title}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

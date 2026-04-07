import { cn } from "@/utils/cn";
import {
  BookingStatus,
  OrderStatus,
  PaymentStatus,
  SubscriptionStatus,
} from "@/types";

type StatusType =
  | BookingStatus
  | OrderStatus
  | PaymentStatus
  | SubscriptionStatus
  | "ACTIVE"
  | "INACTIVE"
  | "VERIFIED"
  | "PENDING_VERIFICATION";

const statusConfig: Record<string, { label: string; className: string }> = {
  // Booking
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
  CHECKED_IN: { label: "Checked In", className: "bg-success-50 text-success-700 dark:bg-green-950 dark:text-green-400 border border-green-200 dark:border-green-800" },
  CHECKED_OUT: { label: "Checked Out", className: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700" },
  CANCELLED: { label: "Cancelled", className: "bg-danger-50 text-danger-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800" },
  NO_SHOW: { label: "No Show", className: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border border-orange-200 dark:border-orange-800" },

  // Order
  PREPARING: { label: "Preparing", className: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border border-purple-200 dark:border-purple-800" },
  READY: { label: "Ready", className: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border border-teal-200 dark:border-teal-800" },
  DELIVERED: { label: "Delivered", className: "bg-success-50 text-success-700 dark:bg-green-950 dark:text-green-400 border border-green-200 dark:border-green-800" },

  // Payment
  PAID: { label: "Paid", className: "bg-success-50 text-success-700 dark:bg-green-950 dark:text-green-400 border border-green-200 dark:border-green-800" },
  PARTIAL: { label: "Partial", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
  REFUNDED: { label: "Refunded", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
  FAILED: { label: "Failed", className: "bg-danger-50 text-danger-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800" },

  // Subscription
  ACTIVE: { label: "Active", className: "bg-success-50 text-success-700 dark:bg-green-950 dark:text-green-400 border border-green-200 dark:border-green-800" },
  TRIAL: { label: "Trial", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
  EXPIRED: { label: "Expired", className: "bg-danger-50 text-danger-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800" },

  // Business
  INACTIVE: { label: "Inactive", className: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700" },
  VERIFIED: { label: "Verified", className: "bg-success-50 text-success-700 dark:bg-green-950 dark:text-green-400 border border-green-200 dark:border-green-800" },
  PENDING_VERIFICATION: { label: "Pending", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
};

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-gray-50 text-gray-600 border border-gray-200",
  };

  return (
    <span className={cn("badge text-xs font-medium", config.className, className)}>
      {config.label}
    </span>
  );
}

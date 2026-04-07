import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function formatDate(date: Date | string, fmt: string = "dd MMM yyyy"): string {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatTimeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  return Math.max(1, differenceInDays(new Date(checkOut), new Date(checkIn)));
}

export function formatDateRange(checkIn: Date | string, checkOut: Date | string): string {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (ci.getMonth() === co.getMonth() && ci.getFullYear() === co.getFullYear()) {
    return `${format(ci, "d")} – ${format(co, "d MMM yyyy")}`;
  }
  return `${format(ci, "d MMM")} – ${format(co, "d MMM yyyy")}`;
}

export function isExpired(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

export function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return 0;
  return Math.max(0, differenceInDays(new Date(date), new Date()));
}

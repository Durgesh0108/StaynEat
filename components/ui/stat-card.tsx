"use client";

import { cn } from "@/utils/cn";
import {
  TrendingUp, TrendingDown, Minus, LucideIcon,
  BedDouble, ShoppingBag, Users, CalendarCheck,
  DollarSign, Clock, Utensils, BarChart3,
  Tag, Wallet, Star, CreditCard, Home,
  Building, CheckCircle, AlertCircle, CalendarRange,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  BedDouble, ShoppingBag, Users, CalendarCheck,
  DollarSign, Clock, Utensils, BarChart3,
  TrendingUp, Tag, Wallet, Star, CreditCard, Home,
  Building, CheckCircle, AlertCircle, CalendarRange,
};

interface StatCardProps {
  // Accept either a LucideIcon component (from client components)
  // or a string name (from server components — can't pass functions across boundary)
  icon: LucideIcon | string;
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  iconBg?: string;
  className?: string;
  loading?: boolean;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  iconColor = "text-primary-500",
  iconBg = "bg-primary-50 dark:bg-primary-950",
  className,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("card p-5 animate-pulse", className)}>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
      </div>
    );
  }

  const Icon: LucideIcon =
    typeof icon === "string" ? (ICON_MAP[icon] ?? Home) : icon;

  const TrendIcon = trend === undefined ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend === undefined
      ? "text-gray-400"
      : trend > 0
      ? "text-success-600 dark:text-success-500"
      : trend < 0
      ? "text-danger-500"
      : "text-gray-400";

  return (
    <div className={cn("card p-5 hover:shadow-md transition-shadow duration-200", className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl flex-shrink-0 ml-3", iconBg)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </div>
      {(trend !== undefined || trendLabel) && (
        <div className={cn("flex items-center gap-1 mt-3 text-sm", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="font-medium">
            {trend !== undefined ? `${Math.abs(trend)}%` : ""}
          </span>
          {trendLabel && (
            <span className="text-gray-500 dark:text-gray-400 font-normal">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

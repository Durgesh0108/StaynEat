"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorCard({
  title = "Unable to load data",
  message = "Something went wrong. Please try refreshing the page.",
  onRetry,
  className,
  compact = false,
}: ErrorCardProps) {
  return (
    <div
      className={cn(
        "card flex flex-col items-center justify-center text-center",
        compact ? "p-6" : "p-12",
        className
      )}
    >
      <div className="w-12 h-12 bg-danger-50 dark:bg-rose-950 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-danger-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

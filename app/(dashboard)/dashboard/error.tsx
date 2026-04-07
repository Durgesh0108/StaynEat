"use client";

import { ErrorCard } from "@/components/ui/error-card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorCard
      title="Dashboard Error"
      message={error.message || "Failed to load dashboard. Please try again."}
      onRetry={reset}
      className="mt-8"
    />
  );
}

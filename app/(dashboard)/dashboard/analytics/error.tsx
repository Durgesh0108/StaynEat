"use client";
import { ErrorCard } from "@/components/ui/error-card";
export default function Error({ reset }: { reset: () => void }) {
  return <ErrorCard message="Failed to load analytics." onRetry={reset} className="mt-6" />;
}

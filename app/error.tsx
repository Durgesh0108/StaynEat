"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
          <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-danger-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-center mb-6 max-w-sm text-sm">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <div className="flex gap-3">
            <button onClick={reset} className="inline-flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <Link href="/" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
              <Home className="h-4 w-4" /> Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

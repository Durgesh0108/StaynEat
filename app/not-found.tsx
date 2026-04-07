import Link from "next/link";
import { Building, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mb-6">
        <Building className="h-10 w-10 text-primary-400" />
      </div>
      <h1 className="text-6xl font-black text-primary-500 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary flex items-center gap-2">
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          Dashboard
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Hotel } from "lucide-react";

export default function HotelNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
        <Hotel className="h-10 w-10 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Hotel Not Found</h1>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
        The hotel you're looking for doesn't exist or may have been deactivated.
      </p>
      <Link href="/" className="btn-primary">
        Back to HospitPro
      </Link>
    </div>
  );
}

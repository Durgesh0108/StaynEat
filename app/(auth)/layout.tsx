import { Building } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Building className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">HospitPro</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Manage your hospitality business smarter
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Hotels, restaurants, bookings, QR menus, payments — all in one place.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Online booking with Razorpay payments",
              "QR code menus for restaurants",
              "Real-time analytics dashboard",
              "Multi-property management",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-200 text-sm">
          © {new Date().getFullYear()} HospitPro. Trusted by 500+ businesses.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">HospitPro</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

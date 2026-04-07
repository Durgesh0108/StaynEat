"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  Hotel,
  BedDouble,
  CalendarRange,
  UtensilsCrossed,
  ShoppingBag,
  QrCode,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Building,
  CreditCard,
  Users,
  ChefHat,
  Receipt,
  Tag,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Business } from "@/types";
import { useNotificationStore } from "@/stores/notificationStore";
import { StatusBadge } from "@/components/ui/status-badge";
import { daysUntil } from "@/utils/formatDate";

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  subItems?: { href: string; label: string }[];
}

function getNavSections(
  business: { type: string; slug: string; settings?: { foodModuleEnabled?: boolean } | null } | null
): SidebarSection[] {
  const isHotel = business?.type === "HOTEL" || business?.type === "BOTH";
  const isRestaurant = business?.type === "RESTAURANT" || business?.type === "BOTH";
  const foodEnabled = business?.settings?.foodModuleEnabled !== false;

  const sections: SidebarSection[] = [
    {
      items: [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
  ];

  if (isHotel) {
    sections.push({
      title: "Hotel",
      items: [
        { href: "/dashboard/hotel/rooms", icon: BedDouble, label: "Rooms" },
        { href: "/dashboard/hotel/bookings", icon: CalendarRange, label: "Bookings" },
        { href: "/dashboard/hotel/calendar", icon: CalendarRange, label: "Calendar" },
        { href: "/dashboard/hotel/guests", icon: Users, label: "Guests" },
        ...(foodEnabled
          ? [
              { href: "/dashboard/hotel/menu", icon: UtensilsCrossed, label: "Food Menu" },
              { href: "/dashboard/hotel/orders", icon: ShoppingBag, label: "Room Orders" },
            ]
          : []),
      ],
    });
  }

  if (isRestaurant) {
    sections.push({
      title: "Restaurant",
      items: [
        { href: "/dashboard/restaurant/menu", icon: UtensilsCrossed, label: "Menu" },
        { href: "/dashboard/restaurant/orders", icon: ShoppingBag, label: "Orders" },
        { href: "/dashboard/restaurant/kitchen", icon: ChefHat, label: "Kitchen Display" },
        { href: "/dashboard/restaurant/tables", icon: Users, label: "Tables & QR" },
      ],
    });
  }

  sections.push({
    title: "Business",
    items: [
      { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/dashboard/revenue", icon: Receipt, label: "Revenue" },
      { href: "/dashboard/coupons", icon: Tag, label: "Coupons" },
      { href: "/dashboard/expenses", icon: Wallet, label: "Expenses" },
      { href: "/dashboard/reviews", icon: BarChart3, label: "Reviews" },
    ],
  });

  sections.push({
    title: "Account",
    items: [
      { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
      { href: "/dashboard/api-docs", icon: ExternalLink, label: "API Docs" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  });

  return sections;
}

interface DashboardLayoutProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string;
    businessId?: string | null;
    businessSlug?: string | null;
    businessType?: string | null;
  };
  business: (Business & { _count?: { notifications: number }; settings?: { foodModuleEnabled: boolean } | null }) | null;
  children: React.ReactNode;
}

export function DashboardLayout({ user, business, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  const sections = getNavSections(business);
  const trialDays = business?.trialEndsAt ? daysUntil(business.trialEndsAt) : 0;
  const isTrialing = business?.subscriptionStatus === "TRIAL";

  const publicUrl = business?.slug
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${business.type === "RESTAURANT" ? "r" : "h"}/${business.slug}`
    : null;

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {business?.name ?? "HospitPro"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </Link>
        </div>

        {/* Trial alert */}
        {isTrialing && trialDays <= 7 && (
          <div className="mx-3 mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-xl text-xs">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {trialDays === 0 ? "Trial expired!" : `${trialDays} day${trialDays === 1 ? "" : "s"} left in trial`}
            </p>
            <Link href="/dashboard/billing" className="text-amber-700 dark:text-amber-400 underline mt-1 block">
              Upgrade now
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sections.map((section, i) => (
            <div key={i} className={cn(i > 0 && "pt-3 mt-3 border-t border-gray-100 dark:border-gray-800")}>
              {section.title && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn("sidebar-link", isActive && "active")}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Public URL */}
        {publicUrl && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-3 py-2"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">View public page</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 px-4 h-14 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          {/* Status badge */}
          {business && (
            <StatusBadge status={business.subscriptionStatus} className="hidden sm:inline-flex" />
          )}

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {(unreadCount > 0 || (business?._count?.notifications ?? 0) > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            )}
          </Link>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown className="h-3 w-3 text-gray-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    {user.role === "SUPER_ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                      >
                        <Hotel className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 page-transition min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

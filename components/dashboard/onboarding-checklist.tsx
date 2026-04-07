"use client";

import { Check, ChevronDown, ChevronUp, Building, BedDouble, UtensilsCrossed, QrCode, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/utils/cn";

interface OnboardingChecklistProps {
  businessId: string;
  businessType: string;
  hasLogo: boolean;
  hasRooms: boolean;
  hasMenuItems: boolean;
  hasTables: boolean;
  slug: string;
}

export function OnboardingChecklist({
  businessType,
  hasLogo,
  hasRooms,
  hasMenuItems,
  hasTables,
  slug,
}: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isHotel = businessType === "HOTEL" || businessType === "BOTH";
  const isRestaurant = businessType === "RESTAURANT" || businessType === "BOTH";

  const steps = [
    {
      id: "logo",
      icon: Building,
      label: "Add your business logo and info",
      done: hasLogo,
      href: "/dashboard/settings",
      cta: "Go to Settings",
    },
    ...(isHotel
      ? [
          {
            id: "rooms",
            icon: BedDouble,
            label: "Add your first room",
            done: hasRooms,
            href: "/dashboard/hotel/rooms",
            cta: "Add Room",
          },
        ]
      : []),
    ...(isRestaurant
      ? [
          {
            id: "menu",
            icon: UtensilsCrossed,
            label: "Add menu items",
            done: hasMenuItems,
            href: "/dashboard/restaurant/menu",
            cta: "Add Menu Item",
          },
          {
            id: "tables",
            icon: QrCode,
            label: "Set up tables & generate QR codes",
            done: hasTables,
            href: "/dashboard/restaurant/tables",
            cta: "Set Up Tables",
          },
        ]
      : []),
  ];

  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  if (completed === steps.length) return null;

  return (
    <div className="card p-5 border-2 border-primary-100 dark:border-primary-900">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Complete your setup ({completed}/{steps.length})
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {steps.length - completed} step{steps.length - completed === 1 ? "" : "s"} remaining to go live
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{progress}%</span>
          </div>
          {collapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                step.done
                  ? "bg-success-50 dark:bg-green-950"
                  : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                  step.done
                    ? "bg-success-100 dark:bg-green-900 text-success-600 dark:text-green-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                )}
              >
                {step.done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <p className={cn("flex-1 text-sm", step.done ? "text-success-700 dark:text-green-300 line-through opacity-75" : "text-gray-700 dark:text-gray-300")}>
                {step.label}
              </p>
              {!step.done && (
                <Link href={step.href} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 whitespace-nowrap">
                  {step.cta} →
                </Link>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <ExternalLink className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your public URL:{" "}
              <a
                href={`/${businessType === "RESTAURANT" ? "r" : "h"}/${slug}`}
                target="_blank"
                className="text-primary-600 dark:text-primary-400 font-medium"
              >
                {`/${businessType === "RESTAURANT" ? "r" : "h"}/${slug}`}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { Building, CreditCard, TrendingUp, Users, ShoppingBag, CalendarRange, CheckCircle, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/utils/formatCurrency";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";
import { DataTable } from "@/components/ui/data-table";
import { PlatformStats } from "@/types";

interface AdminDashboardProps {
  stats: PlatformStats;
  recentSignups: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    subscriptionStatus: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    owner?: { name: string; email: string } | null;
  }>;
}

export function AdminDashboard({ stats, recentSignups }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building}
          label="Total Businesses"
          value={stats.totalBusinesses}
          iconColor="text-primary-600"
          iconBg="bg-primary-50 dark:bg-primary-950"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          iconColor="text-success-600"
          iconBg="bg-success-50 dark:bg-green-950"
        />
        <StatCard
          icon={TrendingUp}
          label="MRR"
          value={formatCurrency(stats.mrr)}
          trendLabel="monthly recurring"
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950"
        />
        <StatCard
          icon={TrendingUp}
          label="ARR"
          value={formatCurrency(stats.arr)}
          trendLabel="annual recurring"
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          icon={CalendarRange}
          label="Total Bookings"
          value={stats.totalBookings}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-950"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats.totalOrders}
          iconColor="text-teal-600"
          iconBg="bg-teal-50 dark:bg-teal-950"
        />
        <StatCard
          icon={Users}
          label="Trial Businesses"
          value={stats.trialBusinesses}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Verification"
          value={recentSignups.filter((b) => !b.isVerified).length}
          iconColor="text-danger-600"
          iconBg="bg-danger-50 dark:bg-rose-950"
        />
      </div>

      {/* Recent Signups */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentSignups.map((biz) => (
                <tr key={biz.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{biz.name}</p>
                    <p className="text-xs text-gray-400">/{biz.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{biz.owner?.name}</p>
                    <p className="text-xs text-gray-400">{biz.owner?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                      {biz.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={biz.subscriptionStatus} />
                      {!biz.isVerified && (
                        <span className="badge bg-amber-50 text-amber-700 text-xs">Unverified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(biz.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a href={`/admin/businesses/${biz.id}`} className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
                        View
                      </a>
                      {!biz.isVerified && (
                        <button className="text-xs text-success-600 hover:text-success-700 font-medium">
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

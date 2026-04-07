"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, BedDouble, Users } from "lucide-react";

interface AnalyticsClientProps {
  businessId: string;
  businessType: string;
}

const COLORS = ["#6C3EF4", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#8B5CF6"];

type Range = "7d" | "30d" | "90d";

export function AnalyticsClient({ businessId, businessType }: AnalyticsClientProps) {
  const [range, setRange] = useState<Range>("30d");

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["analytics-revenue", businessId, range],
    queryFn: () =>
      fetch(`/api/dashboard/revenue?businessId=${businessId}&range=${range}`)
        .then((r) => r.json()),
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics-summary", businessId, range],
    queryFn: () =>
      fetch(`/api/analytics/summary?businessId=${businessId}&range=${range}`)
        .then((r) => r.json()),
  });

  const showHotel = businessType === "HOTEL" || businessType === "BOTH";
  const showRestaurant = businessType === "RESTAURANT" || businessType === "BOTH";

  const stats = summaryData ?? {};

  return (
    <div className="space-y-6">
      {/* Range Toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {(["7d", "30d", "90d"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              range === r
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `₹${(stats.totalRevenue ?? 0).toLocaleString()}`,
            change: stats.revenueChange,
            icon: DollarSign,
            color: "primary",
          },
          {
            label: "Total Orders",
            value: stats.totalOrders ?? 0,
            change: stats.ordersChange,
            icon: ShoppingBag,
            color: "accent",
            show: showRestaurant,
          },
          {
            label: "Total Bookings",
            value: stats.totalBookings ?? 0,
            change: stats.bookingsChange,
            icon: BedDouble,
            color: "success",
            show: showHotel,
          },
          {
            label: "Avg Order Value",
            value: `₹${(stats.avgOrderValue ?? 0).toFixed(0)}`,
            change: stats.avgOrderValueChange,
            icon: Users,
            color: "danger",
          },
        ]
          .filter((s) => s.show !== false)
          .map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${s.color}-100 dark:bg-${s.color}-900/30`}>
                  <s.icon className={`h-4 w-4 text-${s.color}-600`} />
                </div>
              </div>
              {summaryLoading ? (
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
              ) : (
                <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              )}
              {s.change !== undefined && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  s.change >= 0 ? "text-success-600" : "text-danger-600"
                }`}>
                  {s.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(s.change).toFixed(1)}% vs prev period
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Revenue Over Time</h3>
        {revenueLoading ? (
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]}
                labelFormatter={(l) => new Date(l).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              />
              <Legend />
              {showHotel && (
                <Line type="monotone" dataKey="bookings" stroke="#6C3EF4" strokeWidth={2} dot={false} name="Bookings" />
              )}
              {showRestaurant && (
                <Line type="monotone" dataKey="orders" stroke="#F59E0B" strokeWidth={2} dot={false} name="Orders" />
              )}
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily breakdown bar chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Daily Revenue Breakdown</h3>
          {revenueLoading ? (
            <div className="h-52 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(revenueData ?? []).slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                {showHotel && <Bar dataKey="bookings" fill="#6C3EF4" name="Hotel" radius={[2, 2, 0, 0]} />}
                {showRestaurant && <Bar dataKey="orders" fill="#F59E0B" name="Food" radius={[2, 2, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue split pie */}
        {summaryData?.revenueSplit && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Revenue Split</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={summaryData.revenueSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {summaryData.revenueSplit.map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top items */}
      {summaryData?.topItems && summaryData.topItems.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {summaryData.topItems.map((item: { name: string; count: number; revenue: number }, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs flex items-center justify-center font-semibold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.count} sold</p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                  ₹{item.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

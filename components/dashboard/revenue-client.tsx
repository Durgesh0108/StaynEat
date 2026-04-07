"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Receipt, ShoppingBag, CalendarRange } from "lucide-react";
import { formatCurrency, formatCompactCurrency } from "@/utils/formatCurrency";
import { ErrorCard } from "@/components/ui/error-card";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/utils/cn";

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  orders: number;
}

interface RevenueClientProps {
  businessId: string;
  businessType: string;
}

const RANGES = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
] as const;

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-1 text-xs", trend >= 0 ? "text-success-600" : "text-danger-600")}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend).toFixed(1)}% vs previous period
        </div>
      )}
    </div>
  );
}

export function RevenueClient({ businessId, businessType }: RevenueClientProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [chartType, setChartType] = useState<"line" | "bar">("bar");

  const isHotel = businessType === "HOTEL" || businessType === "BOTH";
  const isRestaurant = businessType === "RESTAURANT" || businessType === "BOTH";

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/dashboard/revenue?businessId=${businessId}&range=${range}`)
      .then((r) => r.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [businessId, range]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = data.reduce((s, d) => s + d.bookings, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  if (error) return <ErrorCard message="Failed to load revenue data." />;

  return (
    <div className="space-y-5">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                range === r.key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 ml-auto">
          {(["bar", "line"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                chartType === t
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={Receipt}
            color="bg-primary-500"
          />
          {isHotel && (
            <StatCard
              label="Hotel Bookings"
              value={totalBookings.toString()}
              icon={CalendarRange}
              color="bg-blue-500"
            />
          )}
          {isRestaurant && (
            <StatCard
              label="Food Orders"
              value={totalOrders.toString()}
              icon={ShoppingBag}
              color="bg-emerald-500"
            />
          )}
        </div>
      )}

      {/* Chart */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Revenue Over Time</h3>
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
            No revenue data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {chartType === "bar" ? (
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                />
                <Bar dataKey="revenue" fill="#6C3EF4" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6C3EF4" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#6C3EF4" }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown table */}
      {!loading && data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Daily Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                  {isHotel && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bookings</th>}
                  {isRestaurant && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...data].reverse().map((row) => (
                  <tr key={row.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.date}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</td>
                    {isHotel && <td className="px-4 py-3 text-right text-gray-500">{row.bookings}</td>}
                    {isRestaurant && <td className="px-4 py-3 text-right text-gray-500">{row.orders}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

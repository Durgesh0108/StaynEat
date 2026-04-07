"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Search, Eye, Trash2, Building2, CheckCircle, Clock, XCircle } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string | null;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionEndDate: Date | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  owner: { name: string | null; email: string | null };
  _count: { rooms: number; menuItems: number; bookings: number; orders: number };
}

const STATUS_CONFIG = {
  ACTIVE: { icon: CheckCircle, color: "text-success-600", bg: "bg-success-100 dark:bg-success-900/30" },
  TRIAL: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  CANCELLED: { icon: XCircle, color: "text-danger-600", bg: "bg-danger-100 dark:bg-danger-900/30" },
  EXPIRED: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" },
};

export function AdminBusinessesClient({ businesses: initial }: { businesses: Business[] }) {
  const [businesses, setBusinesses] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = businesses.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.owner.email?.toLowerCase().includes(q) || b.slug.includes(q);
    const matchStatus = statusFilter === "all" || b.subscriptionStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const deleteBusiness = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" and all its data? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
        toast.success("Business deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or slug..."
            className="input pl-9 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input text-sm py-2 w-36">
          <option value="all">All Status</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {["Business", "Owner", "Type", "Status", "Stats", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((b) => {
                const statusCfg = STATUS_CONFIG[b.subscriptionStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.EXPIRED;
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{b.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{b.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-700 dark:text-gray-300">{b.owner.name}</p>
                      <p className="text-xs text-gray-400">{b.owner.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">{b.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {b.subscriptionStatus ?? "NONE"}
                      </div>
                      {b.subscriptionPlan && (
                        <p className="text-xs text-gray-400 mt-0.5">{b.subscriptionPlan}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>{b._count.rooms} rooms · {b._count.menuItems} items</p>
                        <p>{b._count.bookings} bookings · {b._count.orders} orders</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {format(new Date(b.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/businesses/${b.id}`}
                          className="text-gray-400 hover:text-primary-500 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteBusiness(b.id, b.name)}
                          className="text-gray-400 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No businesses found</div>
          )}
        </div>
      </div>
    </div>
  );
}

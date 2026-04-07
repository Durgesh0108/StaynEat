import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";

export default async function AdminSubscriptionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      trialEndsAt: true,
      owner: { select: { email: true } },
    },
    orderBy: { subscriptionEndDate: "desc" },
  });

  const stats = {
    active: businesses.filter((b) => b.subscriptionStatus === "ACTIVE").length,
    trial: businesses.filter((b) => b.subscriptionStatus === "TRIAL").length,
    cancelled: businesses.filter((b) => b.subscriptionStatus === "CANCELLED").length,
    expired: businesses.filter((b) => b.subscriptionStatus === "EXPIRED").length,
    monthly: businesses.filter((b) => b.subscriptionPlan === "MONTHLY").length,
    yearly: businesses.filter((b) => b.subscriptionPlan === "YEARLY").length,
  };

  const mrr = stats.monthly * 999 + stats.yearly * Math.round(9999 / 12);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subscription plans and revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Active", value: stats.active, icon: CheckCircle, color: "text-success-600" },
          { label: "Trial", value: stats.trial, icon: Clock, color: "text-amber-600" },
          { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-danger-600" },
          { label: "Expired", value: stats.expired, icon: XCircle, color: "text-gray-500" },
          { label: "Est. MRR", value: `₹${mrr.toLocaleString()}`, icon: TrendingUp, color: "text-primary-600", wide: true },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${s.wide ? "md:col-span-1" : ""}`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {["Business", "Owner", "Status", "Plan", "Start", "End / Trial", ""].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {businesses.map((b) => {
                const isActive = b.subscriptionStatus === "ACTIVE";
                const isTrial = b.subscriptionStatus === "TRIAL";
                return (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{b.name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{b.owner.email}</td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${
                        isActive ? "bg-success-100 text-success-700" :
                        isTrial ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {b.subscriptionStatus ?? "NONE"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-xs">{b.subscriptionPlan ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {b.subscriptionStartDate ? format(new Date(b.subscriptionStartDate), "dd MMM yy") : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {b.subscriptionEndDate
                        ? format(new Date(b.subscriptionEndDate), "dd MMM yy")
                        : b.trialEndsAt
                        ? `Trial: ${format(new Date(b.trialEndsAt), "dd MMM yy")}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <a href={`/admin/businesses/${b.id}`} className="text-xs text-primary-600 hover:underline">View</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

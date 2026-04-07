import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function AdminAuditLogsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const ACTION_COLORS: Record<string, string> = {
    API_KEY_REGENERATED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    BOOKING_CREATED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    ORDER_CREATED: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
    BUSINESS_UPDATED: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent system activity (last 200 entries)</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {["Time", "User", "Action", "Entity", "Entity ID"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd MMM yy HH:mm")}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{log.user?.name ?? "System"}</p>
                    <p className="text-xs text-gray-400">{log.user?.email ?? ""}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{log.entity}</td>
                  <td className="py-3 px-4 text-xs font-mono text-gray-400 truncate max-w-xs">{log.entityId}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

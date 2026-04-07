import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminSettingsClient } from "@/components/admin/settings-client";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const settingsRows = await prisma.platformSettings.findMany();
  const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure global platform settings</p>
      </div>
      <AdminSettingsClient settings={settings} />
    </div>
  );
}

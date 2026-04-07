export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { ErrorCard } from "@/components/ui/error-card";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: { settings: true },
    });
    if (!business) redirect("/dashboard");

    return (
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your business profile and preferences</p>
        </div>
        <SettingsForm business={business as Parameters<typeof SettingsForm>[0]["business"]} />
      </div>
    );
  } catch (err) {
    console.error("Settings page error:", err);
    return <ErrorCard message="Unable to load settings." className="mt-6" />;
  }
}

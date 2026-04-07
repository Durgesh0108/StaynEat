export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/dashboard/profile-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) redirect("/login");

    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal account information</p>
        </div>
        <ProfileClient
          user={{
            ...user,
            createdAt: user.createdAt.toISOString(),
          }}
        />
      </div>
    );
  } catch (err) {
    console.error("Profile page error:", err);
    return <ErrorCard message="Unable to load profile." className="mt-6" />;
  }
}

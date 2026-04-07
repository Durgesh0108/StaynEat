export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/layout";
import { prisma } from "@/lib/prisma";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get business details
  let business = null;
  try {
    business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: {
        settings: true,
        _count: {
          select: {
            notifications: { where: { isRead: false } },
          },
        },
      },
    });
  } catch {
    // DB unavailable — continue without business data
  }

  return (
    <DashboardLayout
      user={session.user}
      business={business}
    >
      {children}
    </DashboardLayout>
  );
}

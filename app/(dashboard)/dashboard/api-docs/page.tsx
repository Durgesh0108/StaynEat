import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ApiDocsClient } from "@/components/dashboard/api-docs-client";

export default async function ApiDocsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, slug: true, apiKey: true },
  });
  if (!business) redirect("/dashboard");

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Documentation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Use the HospitPro REST API to integrate with your custom systems
        </p>
      </div>
      <ApiDocsClient slug={business.slug} apiKey={business.apiKey ?? ""} />
    </div>
  );
}

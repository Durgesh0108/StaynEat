export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExpensesClient } from "@/components/dashboard/expenses-client";
import { ErrorCard } from "@/components/ui/error-card";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) redirect("/dashboard");

    const expenses = await prisma.expense.findMany({
      where: { businessId: business.id },
      orderBy: { date: "desc" },
      take: 100,
    });

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage your business expenses</p>
        </div>
        <ExpensesClient businessId={business.id} initialExpenses={expenses} />
      </div>
    );
  } catch (err) {
    console.error("Expenses page error:", err);
    return <ErrorCard message="Unable to load expenses." className="mt-6" />;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  businessId: z.string(),
  description: z.string().min(2),
  amount: z.number().min(0.01),
  category: z.string(),
  date: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { businessId, ...data } = parsed.data;
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || (business.ownerId !== session.user.id && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { date, ...rest } = data;
    const expense = await prisma.expense.create({
      data: { ...rest, businessId, date: new Date(date) },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expense create error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

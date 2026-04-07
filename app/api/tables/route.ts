import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  businessId: z.string(),
  tableNumber: z.string().min(1),
  capacity: z.number().min(1),
  floor: z.number().optional().nullable(),
  section: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = schema.parse(body);

    const business = await prisma.business.findFirst({
      where: { id: data.businessId, ownerId: session.user.id },
    });
    if (!business) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const table = await prisma.table.create({
      data: { ...data, isActive: true },
    });
    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Create table error:", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

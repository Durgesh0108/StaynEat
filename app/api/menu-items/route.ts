import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  businessId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(["STARTER", "MAIN_COURSE", "DESSERT", "BEVERAGE", "SNACK", "SPECIAL"]),
  image: z.string().optional(),
  isVeg: z.boolean(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  preparationTime: z.number().default(15),
  spiceLevel: z.enum(["MILD", "MEDIUM", "HOT", "EXTRA_HOT"]).optional().nullable(),
  allergens: z.array(z.string()).default([]),
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

    const item = await prisma.menuItem.create({
      data: { ...data, isActive: true, spiceLevel: data.spiceLevel ?? undefined },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Create menu item error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

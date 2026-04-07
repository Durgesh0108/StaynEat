import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const roomSchema = z.object({
  businessId: z.string(),
  name: z.string().min(2),
  roomNumber: z.string().min(1),
  type: z.enum(["SINGLE", "DOUBLE", "SUITE", "DELUXE", "PRESIDENTIAL"]),
  description: z.string().optional(),
  pricePerNight: z.number().positive(),
  maxOccupancy: z.number().positive(),
  floor: z.number().optional().nullable(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = roomSchema.parse(body);

    // Verify ownership
    const business = await prisma.business.findFirst({
      where: { id: data.businessId, ownerId: session.user.id },
    });
    if (!business) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const room = await prisma.room.create({ data: { ...data, isActive: true } });
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

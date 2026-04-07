export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  businessId: z.string(),
  tableId: z.string().optional().nullable(),
  type: z.enum(["TABLE_MENU", "HOTEL_MENU", "HOTEL_BOOKING"]),
  url: z.string().url(),
  label: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = schema.parse(body);

    // Check if QR already exists for this table
    if (data.tableId) {
      const existing = await prisma.qRCode.findFirst({
        where: { tableId: data.tableId },
      });
      if (existing) {
        const updated = await prisma.qRCode.update({
          where: { id: existing.id },
          data: { url: data.url, isActive: true },
        });
        return NextResponse.json({ qrCode: updated });
      }
    }

    const qrCode = await prisma.qRCode.create({
      data: {
        businessId: data.businessId,
        tableId: data.tableId ?? undefined,
        type: data.type,
        url: data.url,
        label: data.label,
        isActive: true,
      },
    });

    return NextResponse.json({ qrCode }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("QR code error:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}

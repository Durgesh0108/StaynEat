import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (business.ownerId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const apiKey = `hp_${randomBytes(32).toString("hex")}`;
    await prisma.business.update({
      where: { id: params.id },
      data: { apiKey },
    });

    await prisma.auditLog.create({
      data: {
        action: "API_KEY_REGENERATED",
        entity: "Business",
        entityId: params.id,
        userId: session.user.id,
        businessId: params.id,
      },
    });

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("API key generation error:", error);
    return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { businessId } = await req.json();
    await prisma.notification.updateMany({
      where: { businessId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mark all read error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

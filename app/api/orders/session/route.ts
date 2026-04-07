export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const businessId = searchParams.get("businessId");

  if (!sessionId || !businessId) {
    return NextResponse.json({ error: "sessionId and businessId required" }, { status: 400 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { sessionId, businessId },
      include: {
        items: { include: { menuItem: { select: { name: true, image: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const grandSubtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const grandTax = orders.reduce((sum, o) => sum + o.taxAmount, 0);
    const grandDiscount = orders.reduce((sum, o) => sum + o.discountAmount, 0);
    const unpaidTotal = orders.filter((o) => o.paymentStatus === "PENDING").reduce((sum, o) => sum + o.totalAmount, 0);

    return NextResponse.json({ orders, grandTotal, grandSubtotal, grandTax, grandDiscount, unpaidTotal });
  } catch (err) {
    console.error("Session orders error:", err);
    return NextResponse.json({ error: "Failed to fetch session orders" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string(),
  businessId: z.string(),
  paymentMethod: z.enum(["ONLINE", "OFFLINE"]),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const unpaidOrders = await prisma.order.findMany({
      where: { sessionId: data.sessionId, businessId: data.businessId, paymentStatus: "PENDING" },
      select: { id: true, totalAmount: true },
    });

    if (unpaidOrders.length === 0) {
      return NextResponse.json({ error: "No unpaid orders found" }, { status: 400 });
    }

    const totalAmount = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const clearActiveSession = async () => {
      // Clear the shared session from table/room so a new one is created next visit
      const anyOrder = await prisma.order.findFirst({
        where: { sessionId: data.sessionId, businessId: data.businessId },
        select: { tableId: true, roomId: true },
      });
      if (anyOrder?.tableId) {
        await prisma.table.update({ where: { id: anyOrder.tableId }, data: { activeSessionId: null } }).catch(() => {});
      }
      if (anyOrder?.roomId) {
        await prisma.room.update({ where: { id: anyOrder.roomId }, data: { activeSessionId: null } }).catch(() => {});
      }
    };

    if (data.paymentMethod === "ONLINE") {
      if (data.razorpayPaymentId) {
        // Payment verified — mark all as paid
        await prisma.order.updateMany({
          where: { sessionId: data.sessionId, businessId: data.businessId, paymentStatus: "PENDING" },
          data: { paymentStatus: "PAID", razorpayPaymentId: data.razorpayPaymentId },
        });
        await clearActiveSession();
        return NextResponse.json({ success: true, paid: true });
      }

      // Create Razorpay order for total
      const razorpayOrder = await createRazorpayOrder({
        amount: Math.round(totalAmount),
        receipt: `session_${data.sessionId.slice(-8)}`,
        notes: { sessionId: data.sessionId, businessId: data.businessId },
      });

      return NextResponse.json({
        success: true,
        razorpayOrder: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency },
        totalAmount,
      });
    }

    // OFFLINE — mark all as paid immediately
    await prisma.order.updateMany({
      where: { sessionId: data.sessionId, businessId: data.businessId, paymentStatus: "PENDING" },
      data: { paymentStatus: "PAID" },
    });
    await clearActiveSession();

    return NextResponse.json({ success: true, paid: true, totalAmount });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error("Session pay error:", err);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}

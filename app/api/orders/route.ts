export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createRazorpayOrder } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";

const orderSchema = z.object({
  businessId: z.string(),
  tableId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  bookingId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  type: z.enum(["DINE_IN", "ROOM_SERVICE", "TAKEAWAY"]),
  paymentMethod: z.enum(["ONLINE", "OFFLINE"]),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    customizations: z.array(z.string()).default([]),
  })),
  subtotal: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number().default(0),
  couponCode: z.string().optional(),
  totalAmount: z.number(),
  specialInstructions: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      include: { settings: true },
    });
    if (!business || !business.isActive) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const order = await prisma.order.create({
      data: {
        businessId: data.businessId,
        tableId: data.tableId ?? undefined,
        roomId: data.roomId ?? undefined,
        bookingId: data.bookingId ?? undefined,
        sessionId: data.sessionId ?? undefined,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        type: data.type,
        paymentMethod: data.paymentMethod as "ONLINE" | "OFFLINE",
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
        couponCode: data.couponCode,
        totalAmount: data.totalAmount,
        paymentStatus: "PENDING",
        status: "PENDING",
        specialInstructions: data.specialInstructions,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            customizations: item.customizations,
          })),
        },
      },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { tableNumber: true } },
        business: { select: { name: true } },
      },
    });

    // Notification
    try {
      await prisma.notification.create({
        data: {
          businessId: data.businessId,
          type: "NEW_ORDER",
          title: "New Order",
          message: `Order #${order.id.slice(-6).toUpperCase()} from ${data.guestName ?? "guest"}`,
        },
      });
    } catch { /* non-critical */ }

    if (data.paymentMethod === "ONLINE") {
      const razorpayOrder = await createRazorpayOrder({
        amount: data.totalAmount,
        receipt: `order_${order.id.slice(-8)}`,
        notes: {
          orderId: order.id,
          businessName: business.name,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: razorpayOrder.id as string },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const statusParam = searchParams.get("status");

  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const typeParam = searchParams.get("type");
  const searchParam = searchParams.get("search");

  try {
    const where: Record<string, unknown> = { businessId };
    if (statusParam) {
      const statuses = statusParam.split(",");
      where.status = { in: statuses };
    }
    if (typeParam) where.type = typeParam;
    if (searchParam) {
      // Search by guestName — table/room numbers require join filtering (done in-memory)
      where.guestName = { contains: searchParam, mode: "insensitive" };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          table: { select: { tableNumber: true } },
          room: { select: { roomNumber: true, name: true } },
          items: {
            include: { menuItem: { select: { name: true, isVeg: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ data: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

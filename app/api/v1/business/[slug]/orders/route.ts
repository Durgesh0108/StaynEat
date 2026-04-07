export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function verifyApiKey(req: NextRequest, businessId: string): Promise<boolean> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return false;
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { apiKey: true } });
  return business?.apiKey === apiKey;
}

const orderSchema = z.object({
  tableId: z.string().optional(),
  items: z.array(z.object({ menuItemId: z.string(), quantity: z.number().min(1) })).min(1),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  type: z.enum(["DINE_IN", "TAKEAWAY", "ROOM_SERVICE"]).default("DINE_IN"),
  notes: z.string().optional(),
  couponId: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const business = await prisma.business.findUnique({ where: { slug: params.slug } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    if (!(await verifyApiKey(req, business.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    const where = {
      businessId: business.id,
      ...(status ? { status: status as never } : {}),
      ...(type ? { type: type as never } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { menuItem: { select: { name: true } } } },
          table: { select: { tableNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ data: orders, pagination: { page, limit, total } });
  } catch (error) {
    console.error("V1 orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      include: { settings: true },
    });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

    const { items, tableId, couponId, ...orderData } = parsed.data;

    // Get menu items and calculate total
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, businessId: business.id, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ error: "One or more items unavailable" }, { status: 400 });
    }

    const itemMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    const subtotal = items.reduce((s, i) => s + (itemMap[i.menuItemId].price * i.quantity), 0);
    const tax = (subtotal * (business.settings?.taxPercentage ?? 5)) / 100;
    let discount = 0;

    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
      if (coupon?.isActive) {
        discount = coupon.type === "PERCENTAGE"
          ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity)
          : coupon.value;
        await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }
    }

    const order = await prisma.order.create({
      data: {
        ...orderData,
        businessId: business.id,
        tableId: tableId ?? null,
        couponCode: couponId ?? null,
        subtotal,
        taxAmount: tax,
        discountAmount: discount,
        totalAmount: subtotal + tax - discount,
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: itemMap[i.menuItemId].price,
            totalPrice: itemMap[i.menuItemId].price * i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("V1 orders POST error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

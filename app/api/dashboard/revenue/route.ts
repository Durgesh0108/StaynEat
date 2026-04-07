import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const range = searchParams.get("range") ?? "30d";

    if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    const [bookingRevenue, orderRevenue] = await Promise.all([
      prisma.booking.findMany({
        where: {
          businessId,
          paymentStatus: "PAID",
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true, finalAmount: true },
      }),
      prisma.order.findMany({
        where: {
          businessId,
          paymentStatus: "PAID",
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true, totalAmount: true },
      }),
    ]);

    // Build daily data
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const data = allDays.map((day) => {
      const dayStr = format(day, "MMM dd");
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const bookings = bookingRevenue.filter(
        (b) => b.createdAt >= dayStart && b.createdAt <= dayEnd
      );
      const orders = orderRevenue.filter(
        (o) => o.createdAt >= dayStart && o.createdAt <= dayEnd
      );

      const bookingRev = bookings.reduce((s, b) => s + b.finalAmount, 0);
      const orderRev = orders.reduce((s, o) => s + o.totalAmount, 0);

      return {
        date: dayStr,
        revenue: Math.round(bookingRev + orderRev),
        bookings: bookings.length,
        orders: orders.length,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Revenue chart error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}

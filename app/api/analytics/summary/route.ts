import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const range = searchParams.get("range") ?? "30d";

  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || (business.ownerId !== session.user.id && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const now = new Date();
    const startDate = startOfDay(subDays(now, days));
    const prevStartDate = startOfDay(subDays(now, days * 2));

    const [currentBookings, prevBookings, currentOrders, prevOrders, topItems] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId, createdAt: { gte: startDate }, paymentStatus: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { businessId, createdAt: { gte: prevStartDate, lt: startDate }, paymentStatus: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { businessId, createdAt: { gte: startDate }, paymentStatus: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { businessId, createdAt: { gte: prevStartDate, lt: startDate }, paymentStatus: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where: {
          order: { businessId, createdAt: { gte: startDate } },
        },
        _count: { id: true },
        _sum: { subtotal: true },
        orderBy: { _sum: { subtotal: "desc" } },
        take: 5,
      }),
    ]);

    const currentRevenue = [...currentBookings, ...currentOrders].reduce((s, r) => s + r.totalAmount, 0);
    const prevRevenue = [...prevBookings, ...prevOrders].reduce((s, r) => s + r.totalAmount, 0);

    const bookingRevenue = currentBookings.reduce((s, r) => s + r.totalAmount, 0);
    const orderRevenue = currentOrders.reduce((s, r) => s + r.totalAmount, 0);

    const revenueChange = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : currentRevenue > 0 ? 100 : 0;

    const avgOrderValue = currentOrders.length > 0
      ? currentOrders.reduce((s, r) => s + r.totalAmount, 0) / currentOrders.length
      : 0;
    const prevAvgOrderValue = prevOrders.length > 0
      ? prevOrders.reduce((s, r) => s + r.totalAmount, 0) / prevOrders.length
      : 0;
    const avgOrderValueChange = prevAvgOrderValue > 0
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
      : 0;

    // Fetch names for top items
    const menuItemIds = topItems.map((t) => t.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true },
    });
    const nameMap = Object.fromEntries(menuItems.map((m) => [m.id, m.name]));

    const topItemsWithNames = topItems.map((t) => ({
      name: nameMap[t.menuItemId] ?? "Unknown",
      count: t._count.id,
      revenue: t._sum.subtotal ?? 0,
    }));

    const revenueSplit = [];
    if (bookingRevenue > 0) revenueSplit.push({ name: "Hotel", value: bookingRevenue });
    if (orderRevenue > 0) revenueSplit.push({ name: "Food", value: orderRevenue });

    return NextResponse.json({
      totalRevenue: currentRevenue,
      revenueChange,
      totalBookings: currentBookings.length,
      bookingsChange: prevBookings.length > 0
        ? ((currentBookings.length - prevBookings.length) / prevBookings.length) * 100
        : 0,
      totalOrders: currentOrders.length,
      ordersChange: prevOrders.length > 0
        ? ((currentOrders.length - prevOrders.length) / prevOrders.length) * 100
        : 0,
      avgOrderValue,
      avgOrderValueChange,
      revenueSplit: revenueSplit.length > 0 ? revenueSplit : undefined,
      topItems: topItemsWithNames,
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

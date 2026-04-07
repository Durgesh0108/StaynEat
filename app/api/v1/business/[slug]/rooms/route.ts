export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const business = await prisma.business.findUnique({ where: { slug: params.slug } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    const rooms = await prisma.room.findMany({
      where: { businessId: business.id, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        pricePerNight: true,
        maxOccupancy: true,
        amenities: true,
        images: true,
        floor: true,
      },
      orderBy: { pricePerNight: "asc" },
    });

    // Check availability if dates provided
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const conflicts = await prisma.booking.findMany({
        where: {
          businessId: business.id,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          OR: [
            { checkIn: { lt: checkOutDate }, checkOut: { gt: checkInDate } },
          ],
        },
        select: { roomId: true },
      });
      const bookedRoomIds = new Set(conflicts.map((c) => c.roomId));

      const roomsWithAvailability = rooms.map((r) => ({
        ...r,
        available: !bookedRoomIds.has(r.id),
      }));

      return NextResponse.json(roomsWithAvailability, {
        headers: { "Cache-Control": "no-cache" },
      });
    }

    return NextResponse.json(rooms, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  } catch (error) {
    console.error("V1 rooms error:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

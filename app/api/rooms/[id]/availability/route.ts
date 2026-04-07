export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/rooms/[id]/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
// Returns whether the room is available for the given dates.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const checkInStr = searchParams.get("checkIn");
  const checkOutStr = searchParams.get("checkOut");

  if (!checkInStr || !checkOutStr) {
    return NextResponse.json({ error: "checkIn and checkOut required" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      select: { id: true, isAvailable: true, isActive: true },
    });

    if (!room || !room.isActive) {
      return NextResponse.json({ available: false, reason: "Room not found" });
    }

    // Owner has manually disabled this room
    if (!room.isAvailable) {
      return NextResponse.json({ available: false, reason: "Room is currently unavailable" });
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (checkIn >= checkOut) {
      return NextResponse.json({ available: false, reason: "Check-out must be after check-in" });
    }

    // Check for overlapping bookings
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: params.id,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
        // Overlap condition: existing booking overlaps with requested dates
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
      select: { id: true, checkIn: true, checkOut: true, guestName: true },
    });

    if (conflict) {
      return NextResponse.json({
        available: false,
        reason: "Room is already booked for these dates",
        conflictDates: {
          checkIn: conflict.checkIn,
          checkOut: conflict.checkOut,
        },
      });
    }

    return NextResponse.json({ available: true });
  } catch (err) {
    console.error("Availability check error:", err);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}

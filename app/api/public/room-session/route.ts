export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/public/room-session?roomId=xxx
// Returns the shared sessionId for a room — creating one if none exists.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, activeSessionId: true, isActive: true },
    });

    if (!room || !room.isActive) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.activeSessionId) {
      return NextResponse.json({ sessionId: room.activeSessionId, isNew: false });
    }

    const sessionId = randomUUID();
    await prisma.room.update({
      where: { id: roomId },
      data: { activeSessionId: sessionId },
    });

    return NextResponse.json({ sessionId, isNew: true });
  } catch (err) {
    console.error("Room session error:", err);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}

// DELETE /api/public/room-session?roomId=xxx — clears the session after checkout
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  try {
    await prisma.room.update({
      where: { id: roomId },
      data: { activeSessionId: null },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Clear room session error:", err);
    return NextResponse.json({ error: "Failed to clear session" }, { status: 500 });
  }
}

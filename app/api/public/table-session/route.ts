export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/public/table-session?tableId=xxx
// Returns the shared sessionId for a table — creating one if none exists.
// All guests at the same table share this session so their orders are billed together.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");

  if (!tableId) {
    return NextResponse.json({ error: "tableId required" }, { status: 400 });
  }

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, activeSessionId: true, isActive: true },
    });

    if (!table || !table.isActive) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    if (table.activeSessionId) {
      return NextResponse.json({ sessionId: table.activeSessionId, isNew: false });
    }

    // Create a new shared session for this table
    const sessionId = randomUUID();
    await prisma.table.update({
      where: { id: tableId },
      data: { activeSessionId: sessionId },
    });

    return NextResponse.json({ sessionId, isNew: true });
  } catch (err) {
    console.error("Table session error:", err);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}

// DELETE /api/public/table-session?tableId=xxx — clears the session (called after bill payment)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");

  if (!tableId) return NextResponse.json({ error: "tableId required" }, { status: 400 });

  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { activeSessionId: null },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Clear table session error:", err);
    return NextResponse.json({ error: "Failed to clear session" }, { status: 500 });
  }
}

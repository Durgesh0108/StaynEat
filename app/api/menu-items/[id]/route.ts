import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item = await prisma.menuItem.findUnique({
      where: { id: params.id },
      include: { business: { select: { ownerId: true } } },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (item.business.ownerId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.menuItem.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Update menu item error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.menuItem.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete menu item error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

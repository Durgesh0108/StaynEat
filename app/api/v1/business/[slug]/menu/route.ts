export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const business = await prisma.business.findUnique({ where: { slug: params.slug } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isVeg = searchParams.get("isVeg");

    const menuItems = await prisma.menuItem.findMany({
      where: {
        businessId: business.id,
        isAvailable: true,
        ...(category ? { category: category as never } : {}),
        ...(isVeg !== null ? { isVeg: isVeg === "true" } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        isVeg: true,
        spiceLevel: true,
        image: true,
        preparationTime: true,
        isFeatured: true,
      },
      orderBy: [{ isFeatured: "desc" }, { category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(menuItems, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("V1 menu error:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        logo: true,
        coverImage: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        website: true,
        settings: {
          select: {
            checkInTime: true,
            checkOutTime: true,
            taxPercentage: true,
            acceptOnlinePayment: true,
            acceptOfflinePayment: true,
            foodModuleEnabled: true,
            onlineOrderingEnabled: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(business, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("V1 business fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 });
  }
}

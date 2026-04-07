export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const businessId = searchParams.get("businessId");
  const amount = parseFloat(searchParams.get("amount") ?? "0");

  if (!code || !businessId) {
    return NextResponse.json({ valid: false, message: "Missing parameters" }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.findFirst({
      where: {
        businessId,
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, message: "Invalid or expired coupon code" });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: "Coupon usage limit reached" });
    }

    if (coupon.minOrderValue && amount < coupon.minOrderValue) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`,
      });
    }

    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = (amount * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }

    discount = Math.min(discount, amount);

    return NextResponse.json({
      valid: true,
      discount: Math.round(discount),
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      message: `Coupon applied! You save ₹${Math.round(discount)}`,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ valid: false, message: "Failed to validate coupon" }, { status: 500 });
  }
}

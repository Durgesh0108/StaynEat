export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_IDS: Record<string, string> = {
  MONTHLY: process.env.RAZORPAY_PLAN_MONTHLY ?? "",
  YEARLY: process.env.RAZORPAY_PLAN_YEARLY ?? "",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { plan, businessId } = await req.json();
    if (!plan || !businessId) return NextResponse.json({ error: "Missing plan or businessId" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const planId = PLAN_IDS[plan as string];
    if (!planId) {
      return NextResponse.json({ error: "Invalid plan or plan not configured" }, { status: 400 });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: plan === "YEARLY" ? 1 : 12,
      quantity: 1,
      notes: { businessId, plan },
    } as Parameters<typeof razorpay.subscriptions.create>[0]);

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (error) {
    console.error("Subscription create error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { addMonths, addYears } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType: string = event.event;

    switch (eventType) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId: string = payment.order_id;

        // Update booking payment
        const booking = await prisma.booking.findFirst({ where: { razorpayOrderId: orderId } });
        if (booking) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { paymentStatus: "PAID", razorpayPaymentId: payment.id, status: "CONFIRMED" },
          });
        }

        // Update order payment
        const order = await prisma.order.findFirst({ where: { razorpayOrderId: orderId } });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: "PAID", razorpayPaymentId: payment.id, status: "CONFIRMED" },
          });
        }
        break;
      }

      case "subscription.activated": {
        const sub = event.payload.subscription.entity;
        const businessId: string = sub.notes?.businessId;
        const plan: string = sub.notes?.plan;

        if (businessId) {
          const endDate = plan === "YEARLY" ? addYears(new Date(), 1) : addMonths(new Date(), 1);
          await prisma.business.update({
            where: { id: businessId },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionPlan: plan === "YEARLY" ? "YEARLY" : "MONTHLY",
              subscriptionStartDate: new Date(),
              subscriptionEndDate: endDate,
            },
          });
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        const sub = event.payload.subscription.entity;
        const businessId: string = sub.notes?.businessId;
        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: { subscriptionStatus: eventType === "subscription.cancelled" ? "CANCELLED" : "EXPIRED" },
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

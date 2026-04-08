/**
 * POST /api/whatsapp/bill
 *
 * Sends a bill/booking summary to a customer via WhatsApp using Twilio.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID   – Twilio Account SID
 *   TWILIO_AUTH_TOKEN    – Twilio Auth Token
 *   TWILIO_WHATSAPP_FROM – Your Twilio WhatsApp number, e.g. "whatsapp:+14155238886"
 *                          (Sandbox: whatsapp:+14155238886  |  Production: your approved number)
 *
 * Body:
 *   type: "booking" | "food-bill"
 *   phone: string                  – recipient's WhatsApp number (digits only or +91...)
 *   bookingId?: string             – for type=booking
 *   sessionId?: string             – for type=food-bill
 *   businessId?: string            – for type=food-bill
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function twilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  // If it starts with + keep it, otherwise prefix with +91 (India default)
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("91") && digits.length > 10) return `+${digits}`;
  return `+91${digits}`;
}

export async function POST(req: NextRequest) {
  if (!twilioConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { type, phone } = body;

  if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  const to = `whatsapp:${normalisePhone(phone)}`;
  const from = process.env.TWILIO_WHATSAPP_FROM!;

  let messageBody = "";
  let pdfUrl = "";

  try {
    if (type === "booking") {
      const { bookingId, baseUrl } = body;
      if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          room: { select: { name: true, roomNumber: true } },
          business: { select: { name: true } },
        },
      });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

      pdfUrl = baseUrl ? `${baseUrl}/api/pdf/booking?id=${bookingId}` : "";

      messageBody =
        `*Booking Confirmation* ✅\n\n` +
        `*${booking.business.name}*\n` +
        `Booking ID: *#${bookingId.slice(-8).toUpperCase()}*\n\n` +
        `👤 Guest: ${booking.guestName}\n` +
        `🏨 Room: ${booking.room.name} (#${booking.room.roomNumber})\n` +
        `📅 Check-in: ${formatDate(booking.checkIn)}\n` +
        `📅 Check-out: ${formatDate(booking.checkOut)}\n` +
        `🌙 Nights: ${booking.nights}\n\n` +
        `💰 Total: *${formatCurrency(booking.finalAmount)}*\n` +
        `💳 Payment: ${booking.paymentStatus === "PAID" ? "✅ Paid" : "⏳ Pay at check-in"}\n` +
        (pdfUrl ? `\n📄 Download PDF: ${pdfUrl}` : "") +
        `\n\nThank you for your booking! 🙏`;

    } else if (type === "food-bill") {
      const { sessionId, businessId, baseUrl } = body;
      if (!sessionId || !businessId)
        return NextResponse.json({ error: "sessionId and businessId required" }, { status: 400 });

      const [orders, business] = await Promise.all([
        prisma.order.findMany({
          where: { sessionId, businessId },
          include: { items: { include: { menuItem: { select: { name: true } } } } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.business.findUnique({ where: { id: businessId }, select: { name: true } }),
      ]);

      if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

      const grandTotal = orders.reduce((s, o) => s + o.totalAmount, 0);
      const itemCount = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);
      const date = orders[0] ? format(new Date(orders[0].createdAt), "dd MMM yyyy, hh:mm a") : "";

      pdfUrl = baseUrl ? `${baseUrl}/api/pdf/bill?sessionId=${sessionId}&businessId=${businessId}` : "";

      messageBody =
        `*Your Bill* 🧾\n\n` +
        `*${business.name}*\n` +
        `Bill ID: *#${sessionId.slice(-8).toUpperCase()}*\n` +
        `Date: ${date}\n\n` +
        `🛒 Items: ${itemCount}\n` +
        `📦 Orders: ${orders.length}\n\n` +
        `💰 Total: *${formatCurrency(grandTotal)}*\n` +
        (pdfUrl ? `\n📄 Download PDF: ${pdfUrl}` : "") +
        `\n\nThank you for dining with us! 😊`;

    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Send via Twilio
    const twilio = (await import("twilio")).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ body: messageBody, from, to });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[WhatsApp/bill]", err);
    const msg = err instanceof Error ? err.message : "Failed to send WhatsApp message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

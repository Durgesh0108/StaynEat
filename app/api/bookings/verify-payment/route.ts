import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = schema.parse(body);

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId,
        status: "CONFIRMED",
      },
      include: {
        room: { select: { name: true, roomNumber: true } },
        business: { select: { name: true, slug: true } },
      },
    });

    // Send confirmation email
    if (booking.guestEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendBookingConfirmationEmail({
        to: booking.guestEmail,
        guestName: booking.guestName,
        bookingId: booking.id,
        hotelName: booking.business?.name ?? "",
        roomName: booking.room?.name ?? "",
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        finalAmount: booking.finalAmount,
        confirmationUrl: `${appUrl}/h/${booking.business?.slug}/booking/${booking.id}`,
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

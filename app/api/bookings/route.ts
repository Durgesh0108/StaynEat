import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createRazorpayOrder } from "@/lib/razorpay";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { differenceInDays } from "date-fns";

const bookingSchema = z.object({
  businessId: z.string(),
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  nights: z.number().positive(),
  guestName: z.string().min(2),
  guestPhone: z.string().min(10),
  guestEmail: z.string().email().optional().or(z.literal("")),
  adults: z.number().min(1),
  children: z.number().min(0),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(["ONLINE", "OFFLINE"]),
  couponCode: z.string().optional(),
  discountAmount: z.number().default(0),
  totalAmount: z.number(),
  taxAmount: z.number(),
  finalAmount: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = bookingSchema.parse(body);

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      include: { settings: true },
    });
    if (!business || !business.isActive) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check room availability
    const conflicting = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
        OR: [
          {
            checkIn: { lt: new Date(data.checkOut) },
            checkOut: { gt: new Date(data.checkIn) },
          },
        ],
      },
    });

    if (conflicting) {
      return NextResponse.json(
        { error: "Room is not available for these dates" },
        { status: 409 }
      );
    }

    const nights = differenceInDays(new Date(data.checkOut), new Date(data.checkIn)) || 1;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        businessId: data.businessId,
        roomId: data.roomId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail || undefined,
        adults: data.adults,
        children: data.children,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        nights,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount,
        couponCode: data.couponCode,
        finalAmount: data.finalAmount,
        paymentStatus: "PENDING",
        paymentMethod: data.paymentMethod as "ONLINE" | "OFFLINE",
        status: business.settings?.autoConfirmBookings ? "CONFIRMED" : "PENDING",
        specialRequests: data.specialRequests,
      },
      include: { room: { select: { name: true, roomNumber: true } } },
    });

    // Update coupon usage
    if (data.couponCode) {
      try {
        await prisma.coupon.updateMany({
          where: { businessId: data.businessId, code: data.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      } catch { /* non-critical */ }
    }

    // Create notification
    try {
      await prisma.notification.create({
        data: {
          businessId: data.businessId,
          type: "NEW_BOOKING",
          title: "New Booking",
          message: `${data.guestName} booked ${booking.room?.name} for ${nights} nights`,
        },
      });
    } catch { /* non-critical */ }

    // Handle online payment
    if (data.paymentMethod === "ONLINE") {
      const razorpayOrder = await createRazorpayOrder({
        amount: data.finalAmount,
        receipt: `booking_${booking.id.slice(-8)}`,
        notes: {
          bookingId: booking.id,
          guestName: data.guestName,
          businessName: business.name,
        },
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: { razorpayOrderId: razorpayOrder.id as string },
      });

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      });
    }

    // Offline payment — send confirmation email
    if (data.guestEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendBookingConfirmationEmail({
        to: data.guestEmail,
        guestName: data.guestName,
        bookingId: booking.id,
        hotelName: business.name,
        roomName: booking.room?.name ?? "",
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        nights,
        finalAmount: data.finalAmount,
        confirmationUrl: `${appUrl}/h/${business.slug}/booking/${booking.id}`,
      });
    }

    return NextResponse.json({ success: true, bookingId: booking.id, booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const status = searchParams.get("status");

  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  try {
    const where: Record<string, unknown> = { businessId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          room: { select: { name: true, roomNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      data: bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

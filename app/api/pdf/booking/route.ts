/**
 * GET /api/pdf/booking?id=<bookingId>
 *
 * Generates and streams an A4 booking confirmation PDF using
 * Playwright + Chromium + Tailwind CSS.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePDF } from "@/lib/pdf-generator";
import { buildBookingHTML } from "@/lib/pdf-templates/booking";

export const dynamic = "force-dynamic";
// Increase max duration for PDF generation (Vercel Pro: up to 60s)
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("id");

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: { select: { name: true, roomNumber: true, type: true } },
        business: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            settings: { select: { checkInTime: true, checkOutTime: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Compute tax: finalAmount = totalAmount + tax - discount
    const taxAmount = booking.finalAmount - booking.totalAmount + booking.discountAmount;

    const html = buildBookingHTML({
      bookingId: booking.id,
      businessName: booking.business.name,
      businessAddress: booking.business.address,
      businessPhone: booking.business.phone,
      businessEmail: booking.business.email,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      guestEmail: booking.guestEmail,
      adults: booking.adults,
      children: booking.children,
      roomName: booking.room.name,
      roomNumber: booking.room.roomNumber,
      roomType: booking.room.type,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      checkInTime: booking.business.settings?.checkInTime,
      checkOutTime: booking.business.settings?.checkOutTime,
      totalAmount: booking.totalAmount,
      taxAmount: Math.max(0, taxAmount),
      discountAmount: booking.discountAmount,
      finalAmount: booking.finalAmount,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      couponCode: booking.couponCode,
      specialRequests: booking.specialRequests,
      generatedAt: new Date(),
    });

    const pdfBuffer = await generatePDF(html, { format: "A4" });

    const filename = `booking-${booking.id.slice(-8).toUpperCase()}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[PDF/booking]", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

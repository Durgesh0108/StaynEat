export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.business.ownerId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();

    // Auto-recalculate nights + amounts when check-in/check-out changes
    if (body.checkOut || body.checkIn) {
      const checkIn  = new Date(body.checkIn  ?? booking.checkIn);
      const checkOut = new Date(body.checkOut ?? booking.checkOut);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      body.nights = nights;

      // Recalculate financials only when extending (never silently reduce on early checkout)
      if (nights > booking.nights) {
        const nightlyRate      = booking.totalAmount / booking.nights;
        const additionalNights = nights - booking.nights;
        const newTotalAmount   = booking.totalAmount + nightlyRate * additionalNights;
        const newFinalAmount   = newTotalAmount - booking.discountAmount;
        body.totalAmount = newTotalAmount;
        body.finalAmount = newFinalAmount;

        // Determine how much was previously paid (handle legacy records where paidAmount wasn't tracked)
        const effectivePaidAmount =
          (booking.paidAmount ?? 0) > 0
            ? (booking.paidAmount ?? 0)
            : booking.paymentStatus === "PAID"
            ? booking.finalAmount
            : 0;

        // If legacy record had paidAmount=0 but was fully paid, persist that now
        if ((booking.paidAmount ?? 0) === 0 && booking.paymentStatus === "PAID") {
          body.paidAmount = booking.finalAmount;
        }

        // There's now an outstanding balance — mark payment as PENDING
        if (newFinalAmount > effectivePaidAmount) {
          body.paymentStatus = "PENDING";
        }
      }
    }

    // When marking PAID, record the full amount as paid
    if (body.paymentStatus === "PAID") {
      body.paidAmount = booking.finalAmount;
    }
    // When refunded, clear paid amount
    if (body.paymentStatus === "REFUNDED") {
      body.paidAmount = 0;
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        room: true,
        business: { select: { name: true, slug: true, settings: true } },
      },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

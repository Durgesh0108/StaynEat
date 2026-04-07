import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function verifyApiKey(req: NextRequest, businessId: string): Promise<boolean> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return false;
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { apiKey: true } });
  return business?.apiKey === apiKey;
}

const createSchema = z.object({
  roomId: z.string(),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  adults: z.number().min(1).default(1),
  children: z.number().min(0).default(0),
  specialRequests: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const business = await prisma.business.findUnique({ where: { slug: params.slug } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    if (!(await verifyApiKey(req, business.id))) {
      return NextResponse.json({ error: "Unauthorized. Provide a valid X-API-Key header." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const skip = (page - 1) * limit;

    const where = {
      businessId: business.id,
      ...(status ? { status: status as never } : {}),
      ...(from || to ? { checkIn: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          checkIn: true,
          checkOut: true,
          adults: true,
          children: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          room: { select: { name: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      data: bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("V1 bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      include: { settings: true },
    });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    if (!(await verifyApiKey(req, business.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

    const { roomId, checkInDate, checkOutDate, ...guestData } = parsed.data;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) return NextResponse.json({ error: "Invalid dates" }, { status: 400 });

    const room = await prisma.room.findUnique({ where: { id: roomId, businessId: business.id } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const conflict = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
      },
    });
    if (conflict) return NextResponse.json({ error: "Room not available for selected dates" }, { status: 409 });

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const subtotal = room.pricePerNight * nights;
    const tax = (subtotal * (business.settings?.taxPercentage ?? 18)) / 100;
    const totalAmount = subtotal + tax;

    const booking = await prisma.booking.create({
      data: {
        ...guestData,
        roomId,
        businessId: business.id,
        checkIn,
        checkOut,
        nights,
        totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "ONLINE",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("V1 bookings POST error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

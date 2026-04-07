import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/hotel/public/booking-flow";

export const metadata: Metadata = { title: "Book Room" };

interface Props {
  params: { slug: string };
  searchParams: { roomId?: string; checkIn?: string; checkOut?: string };
}

export default async function BookingPage({ params, searchParams }: Props) {
  try {
    const { roomId, checkIn, checkOut } = searchParams;

    if (!roomId) notFound();

    const business = await prisma.business.findUnique({
      where: { slug: params.slug, isActive: true },
      include: { settings: true },
    });

    if (!business) notFound();

    const room = await prisma.room.findFirst({
      where: { id: roomId, businessId: business.id, isActive: true },
    });

    if (!room) notFound();

    // Check if room is available for these dates
    if (checkIn && checkOut) {
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          roomId,
          status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
          OR: [
            {
              checkIn: { lte: new Date(checkOut) },
              checkOut: { gte: new Date(checkIn) },
            },
          ],
        },
      });

      if (conflictingBooking) {
        return (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="card p-8 max-w-md w-full text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Room Not Available</h2>
              <p className="text-gray-500 mb-4">This room is already booked for the selected dates.</p>
              <a href={`/h/${params.slug}`} className="btn-primary inline-block">
                Choose Different Dates
              </a>
            </div>
          </div>
        );
      }
    }

    return (
      <BookingFlow
        business={business as Parameters<typeof BookingFlow>[0]["business"]}
        room={room as Parameters<typeof BookingFlow>[0]["room"]}
        checkInStr={checkIn}
        checkOutStr={checkOut}
      />
    );
  } catch (error) {
    console.error("Booking page error:", error);
    notFound();
  }
}

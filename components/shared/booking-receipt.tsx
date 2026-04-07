"use client";

import dynamic from "next/dynamic";
import { Download, MessageCircle } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span>Loading...</span> }
);
const Document = dynamic(() => import("@react-pdf/renderer").then((m) => m.Document), { ssr: false });
const Page = dynamic(() => import("@react-pdf/renderer").then((m) => m.Page), { ssr: false });
const View = dynamic(() => import("@react-pdf/renderer").then((m) => m.View), { ssr: false });
const Text = dynamic(() => import("@react-pdf/renderer").then((m) => m.Text), { ssr: false });
const StyleSheet = dynamic(() => import("@react-pdf/renderer").then((m) => m.StyleSheet), { ssr: false });

interface BookingReceiptProps {
  booking: {
    id: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string | null;
    checkIn: Date | string;
    checkOut: Date | string;
    nights: number;
    finalAmount: number;
    totalAmount: number;
    taxAmount?: number;
    discountAmount?: number;
    paymentStatus: string;
    paymentMethod?: string | null;
    status: string;
    room?: { name: string; roomNumber: string } | null;
  };
  businessName: string;
}

function WhatsAppLink({ booking, businessName }: BookingReceiptProps) {
  const msg = encodeURIComponent(
    `*Booking Confirmed!* 🎉\n\n` +
    `Hotel: *${businessName}*\n` +
    `Guest: *${booking.guestName}*\n` +
    `Booking ID: *#${booking.id.slice(-8).toUpperCase()}*\n` +
    `Room: ${booking.room?.name ?? "—"}\n` +
    `Check-in: ${formatDate(booking.checkIn)}\n` +
    `Check-out: ${formatDate(booking.checkOut)}\n` +
    `Total: *${formatCurrency(booking.finalAmount)}*\n\n` +
    `We look forward to welcoming you! 🏨`
  );
  return `https://wa.me/?text=${msg}`;
}

export function BookingReceipt({ booking, businessName }: BookingReceiptProps) {
  const bookingId = `#${booking.id.slice(-8).toUpperCase()}`;

  return (
    <div className="text-left">
      {/* Receipt Preview */}
      <div className="card p-5 mb-4 text-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">{businessName}</h3>
          <span className="text-xs text-gray-400">{bookingId}</span>
        </div>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <div className="flex justify-between"><span>Guest</span><strong>{booking.guestName}</strong></div>
          <div className="flex justify-between"><span>Phone</span><strong>{booking.guestPhone}</strong></div>
          {booking.room && (
            <div className="flex justify-between"><span>Room</span><strong>{booking.room.name}</strong></div>
          )}
          <div className="flex justify-between"><span>Check-in</span><strong>{formatDate(booking.checkIn)}</strong></div>
          <div className="flex justify-between"><span>Check-out</span><strong>{formatDate(booking.checkOut)}</strong></div>
          <div className="flex justify-between"><span>Nights</span><strong>{booking.nights}</strong></div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span className="text-primary-600 dark:text-primary-400">{formatCurrency(booking.finalAmount)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Payment</span>
            <span className={booking.paymentStatus === "PAID" ? "text-success-600" : "text-amber-600"}>
              {booking.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <a
          href={WhatsAppLink({ booking, businessName })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
}

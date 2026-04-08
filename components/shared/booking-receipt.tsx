"use client";

import { useState } from "react";
import { Download, MessageCircle, Printer, FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { printThermalReceipt, type ThermalPaperSize } from "@/utils/thermalPrint";

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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [paperSize, setPaperSize] = useState<ThermalPaperSize>("80mm");

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const [{ pdf }, { BookingPDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/shared/booking-pdf-document"),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(
        (await import("react")).createElement(BookingPDFDocument as any, { booking, businessName }) as any
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `booking-${bookingId.replace("#", "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation failed", e);
      window.print();
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleThermalPrint = () => {
    printThermalReceipt(
      {
        type: "booking",
        businessName,
        bookingId,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        room: booking.room ? `${booking.room.name} #${booking.room.roomNumber}` : undefined,
        checkIn: formatDate(booking.checkIn),
        checkOut: formatDate(booking.checkOut),
        nights: booking.nights,
        subtotal: booking.totalAmount,
        tax: booking.taxAmount ?? 0,
        discount: booking.discountAmount ?? 0,
        total: booking.finalAmount,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod ?? "OFFLINE",
      },
      paperSize
    );
  };

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
          {(booking.taxAmount ?? 0) > 0 && (
            <div className="flex justify-between text-xs"><span>Tax</span><span>{formatCurrency(booking.taxAmount!)}</span></div>
          )}
          {(booking.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-xs text-success-600"><span>Discount</span><span>-{formatCurrency(booking.discountAmount!)}</span></div>
          )}
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
      <div className="grid grid-cols-2 gap-2 mb-2">
        <a
          href={WhatsAppLink({ booking, businessName })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
          className="flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
        >
          {generatingPDF ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {generatingPDF ? "Generating..." : "Download PDF"}
        </button>
      </div>

      {/* Paper size picker + print */}
      <div className="flex gap-2 items-stretch">
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setPaperSize("80mm")}
            className={`px-3 py-2 transition-colors ${
              paperSize === "80mm"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            80mm
          </button>
          <button
            onClick={() => setPaperSize("57mm")}
            className={`px-3 py-2 border-l border-gray-200 dark:border-gray-700 transition-colors ${
              paperSize === "57mm"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            57mm
          </button>
        </div>
        <button
          onClick={handleThermalPrint}
          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm"
        >
          <Printer className="h-4 w-4" />
          Print Receipt
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-1.5">
        80mm = standard POS · 57mm = mobile / card terminal
      </p>
    </div>
  );
}

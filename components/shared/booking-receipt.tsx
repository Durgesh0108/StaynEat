"use client";

import { useState } from "react";
import { MessageCircle, Printer, FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { printThermalReceipt, type ThermalPaperSize } from "@/utils/thermalPrint";
import { WhatsAppBillShare } from "@/components/shared/whatsapp-bill-share";

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

function whatsAppUrl({ booking, businessName }: BookingReceiptProps) {
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
  const [downloading, setDownloading] = useState(false);
  const [paperSize, setPaperSize] = useState<ThermalPaperSize>("80mm");

  // ── PDF via server API (Playwright + Tailwind, A4) ───────────────────────
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/pdf/booking?id=${booking.id}`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `booking-${bookingId.replace("#", "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  // ── Thermal print via new browser window ─────────────────────────────────
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
          <div className="flex justify-between"><span>Guest</span><strong className="text-gray-900 dark:text-white">{booking.guestName}</strong></div>
          <div className="flex justify-between"><span>Phone</span><strong className="text-gray-900 dark:text-white">{booking.guestPhone}</strong></div>
          {booking.room && (
            <div className="flex justify-between"><span>Room</span><strong className="text-gray-900 dark:text-white">{booking.room.name}</strong></div>
          )}
          <div className="flex justify-between"><span>Check-in</span><strong className="text-gray-900 dark:text-white">{formatDate(booking.checkIn)}</strong></div>
          <div className="flex justify-between"><span>Check-out</span><strong className="text-gray-900 dark:text-white">{formatDate(booking.checkOut)}</strong></div>
          <div className="flex justify-between"><span>Nights</span><strong className="text-gray-900 dark:text-white">{booking.nights}</strong></div>
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

      {/* Row 1: WhatsApp + Download PDF */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <a
          href={whatsAppUrl({ booking, businessName })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>

      {/* Row 2: Paper size toggle + Print Receipt */}
      <div className="flex gap-2 items-stretch">
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setPaperSize("80mm")}
            title="Standard retail / POS printer"
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
            title="Mobile printer / card terminal"
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
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          title="Download receipt PDF"
          className="flex items-center justify-center gap-1 btn-secondary text-sm px-3"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-1.5">
        80mm = standard POS · 57mm = mobile / card terminal
      </p>

      {/* WhatsApp via Twilio (only when payment is done online) */}
      {booking.paymentStatus === "PAID" && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <WhatsAppBillShare
            type="booking"
            bookingId={booking.id}
            defaultPhone={booking.guestPhone}
          />
        </div>
      )}
    </div>
  );
}

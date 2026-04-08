import { format } from "date-fns";

export interface BookingTemplateData {
  bookingId: string;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  adults: number;
  children: number;
  roomName: string;
  roomNumber: string;
  roomType?: string;
  checkIn: Date | string;
  checkOut: Date | string;
  nights: number;
  checkInTime?: string;
  checkOutTime?: string;
  totalAmount: number;       // room charges before tax
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  couponCode?: string | null;
  specialRequests?: string | null;
  generatedAt: Date;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(d: Date | string): string {
  return format(new Date(d), "EEEE, dd MMMM yyyy");
}

export function buildBookingHTML(data: BookingTemplateData): string {
  const isPaid = data.paymentStatus === "PAID";
  const shortId = data.bookingId.slice(-8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation – ${data.businessName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
          colors: {
            brand: { 50:'#eff6ff', 100:'#dbeafe', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8' }
          }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body class="font-sans bg-gray-50 text-gray-900 antialiased">

  <div class="max-w-2xl mx-auto bg-white shadow-sm">

    <!-- Header strip -->
    <div class="bg-brand-600 px-8 py-6 text-white">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">${data.businessName}</h1>
          ${data.businessAddress ? `<p class="text-brand-100 text-sm mt-0.5">${data.businessAddress}</p>` : ""}
          ${data.businessPhone ? `<p class="text-brand-100 text-sm">${data.businessPhone}</p>` : ""}
        </div>
        <div class="text-right">
          <span class="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Booking Confirmed
          </span>
          <p class="text-brand-100 text-sm mt-2">ID: #${shortId}</p>
        </div>
      </div>
    </div>

    <div class="px-8 py-6 space-y-6">

      <!-- Guest section -->
      <div>
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Guest Information</h2>
        <div class="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-6">
          <div>
            <p class="text-xs text-gray-400">Full Name</p>
            <p class="font-semibold text-gray-900">${data.guestName}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400">Phone</p>
            <p class="font-semibold text-gray-900">${data.guestPhone}</p>
          </div>
          ${data.guestEmail ? `
          <div class="col-span-2">
            <p class="text-xs text-gray-400">Email</p>
            <p class="font-semibold text-gray-900">${data.guestEmail}</p>
          </div>` : ""}
          <div>
            <p class="text-xs text-gray-400">Adults</p>
            <p class="font-semibold text-gray-900">${data.adults}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400">Children</p>
            <p class="font-semibold text-gray-900">${data.children}</p>
          </div>
        </div>
      </div>

      <!-- Room & Stay -->
      <div>
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Room & Stay Details</h2>
        <div class="border border-gray-100 rounded-xl overflow-hidden">
          <div class="bg-brand-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p class="font-bold text-gray-900">${data.roomName}</p>
              <p class="text-sm text-gray-500">Room #${data.roomNumber}${data.roomType ? " · " + data.roomType : ""}</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold text-brand-600">${fmt(data.totalAmount / data.nights)}<span class="text-sm font-normal text-gray-400">/night</span></p>
            </div>
          </div>
          <div class="px-4 py-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-xs text-gray-400 mb-0.5">Check-in</p>
              <p class="font-semibold text-gray-900">${fmtDate(data.checkIn)}</p>
              ${data.checkInTime ? `<p class="text-xs text-gray-400">from ${data.checkInTime}</p>` : ""}
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-400 mb-0.5">Duration</p>
              <p class="text-2xl font-bold text-gray-900">${data.nights}</p>
              <p class="text-xs text-gray-400">${data.nights === 1 ? "night" : "nights"}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-400 mb-0.5">Check-out</p>
              <p class="font-semibold text-gray-900">${fmtDate(data.checkOut)}</p>
              ${data.checkOutTime ? `<p class="text-xs text-gray-400">by ${data.checkOutTime}</p>` : ""}
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Summary -->
      <div>
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment Summary</h2>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Room charges (${data.nights} night${data.nights !== 1 ? "s" : ""})</span>
            <span class="font-medium text-gray-900">${fmt(data.totalAmount)}</span>
          </div>
          ${data.taxAmount > 0 ? `
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Tax & fees</span>
            <span class="font-medium text-gray-900">${fmt(data.taxAmount)}</span>
          </div>` : ""}
          ${data.discountAmount > 0 ? `
          <div class="flex justify-between text-sm">
            <span class="text-green-600">Discount${data.couponCode ? " (" + data.couponCode + ")" : ""}</span>
            <span class="font-medium text-green-600">− ${fmt(data.discountAmount)}</span>
          </div>` : ""}
          <div class="flex justify-between items-center pt-3 border-t-2 border-gray-900">
            <span class="font-bold text-gray-900 text-lg">Total</span>
            <span class="font-bold text-brand-600 text-2xl">${fmt(data.finalAmount)}</span>
          </div>

          <!-- Payment status badge -->
          <div class="flex items-center justify-between pt-2">
            <span class="text-sm text-gray-500">Payment status</span>
            <span class="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}">
              <span class="w-1.5 h-1.5 rounded-full ${isPaid ? "bg-green-500" : "bg-amber-500"} inline-block"></span>
              ${isPaid ? "Paid" : "Pending — Pay at check-in"}
            </span>
          </div>
          ${data.paymentMethod ? `
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Payment method</span>
            <span class="text-gray-700 font-medium">${data.paymentMethod === "ONLINE" ? "Online Payment (Razorpay)" : "Cash / Card at Property"}</span>
          </div>` : ""}
        </div>
      </div>

      ${data.specialRequests ? `
      <!-- Special Requests -->
      <div>
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Special Requests</h2>
        <p class="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 italic">"${data.specialRequests}"</p>
      </div>` : ""}

      <!-- Note -->
      <div class="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        Please carry this confirmation at check-in along with a valid photo ID.
        ${!isPaid ? " Payment is due at the property." : ""}
      </div>

    </div>

    <!-- Footer -->
    <div class="border-t border-gray-100 px-8 py-4 flex items-center justify-between text-xs text-gray-400">
      <span>${data.businessName} · Booking #${shortId}</span>
      <span>Generated ${format(new Date(data.generatedAt), "dd MMM yyyy, hh:mm a")}</span>
    </div>

  </div>

</body>
</html>`;
}

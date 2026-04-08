import { format } from "date-fns";
import type { ThermalWidth } from "@/lib/pdf-generator";

export interface FoodBillTemplateData {
  sessionId: string;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  context: "restaurant" | "hotel";
  tableNumber?: string;
  roomNumber?: string;
  orders: Array<{
    id: string;
    index: number;
    createdAt: Date | string;
    status: string;
    items: Array<{ name: string; qty: number; unitPrice: number; totalPrice: number }>;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  }>;
  grandSubtotal: number;
  grandTax: number;
  grandDiscount: number;
  grandTotal: number;
  paymentMethod?: string;
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

// ─── A4 full bill (for Download PDF) ────────────────────────────────────────

export function buildFoodBillA4HTML(data: FoodBillTemplateData): string {
  const billId = data.sessionId.slice(-8).toUpperCase();
  const isOnline = data.paymentMethod === "ONLINE";
  const label = data.context === "hotel" ? "Room Service Bill" : "Restaurant Bill";
  const locationLine = data.tableNumber
    ? `Table ${data.tableNumber}`
    : data.roomNumber
    ? `Room ${data.roomNumber}`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${label} – ${data.businessName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { fontFamily: { sans: ['Inter','system-ui','sans-serif'] } } }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body class="font-sans bg-gray-50 text-gray-900 antialiased">
<div class="max-w-2xl mx-auto bg-white shadow-sm">

  <!-- Header -->
  <div class="bg-gray-900 px-8 py-6 text-white">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">${data.businessName}</h1>
        ${data.businessAddress ? `<p class="text-gray-400 text-sm mt-0.5">${data.businessAddress}</p>` : ""}
        ${data.businessPhone ? `<p class="text-gray-400 text-sm">${data.businessPhone}</p>` : ""}
      </div>
      <div class="text-right">
        <span class="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">${label}</span>
        <p class="text-gray-400 text-sm mt-2">Bill #${billId}</p>
        ${locationLine ? `<p class="text-gray-300 text-sm font-semibold">${locationLine}</p>` : ""}
        <p class="text-gray-500 text-xs mt-1">${format(new Date(data.generatedAt), "dd MMM yyyy, hh:mm a")}</p>
      </div>
    </div>
  </div>

  <div class="px-8 py-6 space-y-6">

    <!-- Orders -->
    <div>
      <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Order Details (${data.orders.length} order${data.orders.length !== 1 ? "s" : ""})
      </h2>
      <div class="space-y-3">
        ${data.orders.map((order) => `
        <div class="border border-gray-100 rounded-xl overflow-hidden">
          <div class="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-gray-500">Order ${order.index}</span>
              <span class="text-xs text-gray-400">· ${format(new Date(order.createdAt), "hh:mm a")}</span>
            </div>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${
              order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
              order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            }">${order.status}</span>
          </div>
          <div class="px-4 py-3">
            <!-- Column headers -->
            <div class="flex text-xs text-gray-400 font-semibold border-b border-gray-100 pb-1.5 mb-2">
              <span class="flex-1">Item</span>
              <span class="w-12 text-center">Qty</span>
              <span class="w-20 text-right">Price</span>
              <span class="w-24 text-right">Amount</span>
            </div>
            ${order.items.map((item) => `
            <div class="flex items-baseline text-sm py-1">
              <span class="flex-1 text-gray-700">${item.name}</span>
              <span class="w-12 text-center text-gray-500">${item.qty}</span>
              <span class="w-20 text-right text-gray-500">${fmt(item.unitPrice)}</span>
              <span class="w-24 text-right font-medium text-gray-900">${fmt(item.totalPrice)}</span>
            </div>`).join("")}
            <div class="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 mt-1">
              <span>Order total</span>
              <span class="font-semibold text-gray-700">${fmt(order.totalAmount)}</span>
            </div>
          </div>
        </div>`).join("")}
      </div>
    </div>

    <!-- Grand Total -->
    <div>
      <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Grand Summary</h2>
      <div class="bg-gray-50 rounded-xl p-5 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Subtotal</span>
          <span class="font-medium text-gray-900">${fmt(data.grandSubtotal)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Tax & charges</span>
          <span class="font-medium text-gray-900">${fmt(data.grandTax)}</span>
        </div>
        ${data.grandDiscount > 0 ? `
        <div class="flex justify-between text-sm">
          <span class="text-green-600">Discount</span>
          <span class="font-medium text-green-600">− ${fmt(data.grandDiscount)}</span>
        </div>` : ""}
        <div class="flex justify-between items-center pt-3 border-t-2 border-gray-900">
          <span class="font-bold text-gray-900 text-lg">Total</span>
          <span class="font-bold text-gray-900 text-2xl">${fmt(data.grandTotal)}</span>
        </div>
        ${data.paymentMethod ? `
        <div class="flex justify-between text-sm pt-2">
          <span class="text-gray-500">Payment method</span>
          <span class="font-semibold ${isOnline ? "text-blue-600" : "text-amber-600"}">
            ${isOnline ? "Online Payment" : "Cash / Card"}
          </span>
        </div>` : ""}
      </div>
    </div>

    <!-- Thank you -->
    <div class="text-center py-4">
      <p class="text-lg font-bold text-gray-900">Thank you for your visit!</p>
      <p class="text-sm text-gray-400 mt-1">We hope to see you again at ${data.businessName}</p>
    </div>

  </div>

  <!-- Footer -->
  <div class="border-t border-gray-100 px-8 py-4 flex items-center justify-between text-xs text-gray-400">
    <span>${data.businessName} · Bill #${billId}</span>
    <span>Generated ${format(new Date(data.generatedAt), "dd MMM yyyy, hh:mm a")}</span>
  </div>

</div>
</body>
</html>`;
}

// ─── Thermal receipt (80mm or 57mm) ─────────────────────────────────────────

export function buildFoodBillThermalHTML(
  data: FoodBillTemplateData,
  width: ThermalWidth
): string {
  const billId = data.sessionId.slice(-8).toUpperCase();
  const is80mm = width === "80mm";
  const fontSize = is80mm ? "12px" : "10px";
  const smallSize = is80mm ? "10px" : "9px";
  const bigSize = is80mm ? "15px" : "13px";
  const divider = is80mm
    ? "================================"
    : "========================";
  const thinDiv = is80mm
    ? "--------------------------------"
    : "------------------------";

  const locationLine = data.tableNumber
    ? `Table: ${data.tableNumber}`
    : data.roomNumber
    ? `Room: ${data.roomNumber}`
    : "";

  function rupees(n: number) {
    return `Rs.${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  const ordersHTML = data.orders.map((order) => `
    <div style="font-size:${smallSize};color:#555;margin:4px 0 2px;">
      Order ${order.index} · ${format(new Date(order.createdAt), "hh:mm a")}
    </div>
    ${order.items.map((item) => `
    <div style="display:flex;justify-content:space-between;margin:2px 0;">
      <span style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding-right:3px;">${item.qty}x ${item.name}</span>
      <span style="flex-shrink:0;white-space:nowrap;">${rupees(item.totalPrice)}</span>
    </div>`).join("")}
    <div style="display:flex;justify-content:space-between;font-size:${smallSize};color:#555;margin:2px 0 4px;">
      <span>Order Total</span><span>${rupees(order.totalAmount)}</span>
    </div>
    <div style="text-align:center;margin:2px 0;font-size:${smallSize};color:#777;">${thinDiv}</div>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.5;
      background: #fff;
      color: #000;
      width: 100%;
    }
    @media print {
      @page { size: ${width} auto; margin: 0; }
    }
  </style>
</head>
<body>
  <div style="padding:4mm 3mm 8mm 3mm;">
    <div style="text-align:center;font-weight:bold;font-size:${bigSize};margin-bottom:2px;">${data.businessName}</div>
    <div style="text-align:center;font-size:${smallSize};">${data.context === "hotel" ? "ROOM SERVICE BILL" : "RESTAURANT BILL"}</div>
    ${locationLine ? `<div style="text-align:center;font-size:${smallSize};">${locationLine}</div>` : ""}
    <div style="text-align:center;font-size:${smallSize};">Bill: #${billId}</div>
    <div style="text-align:center;font-size:${smallSize};">${format(new Date(data.generatedAt), "dd MMM yyyy, hh:mm a")}</div>
    <div style="text-align:center;margin:4px 0;font-size:${smallSize};">${divider}</div>

    <div style="font-weight:bold;font-size:${smallSize};margin-bottom:2px;">ITEMS</div>
    <div style="text-align:center;margin:2px 0;font-size:${smallSize};color:#777;">${thinDiv}</div>

    ${ordersHTML}

    <div style="display:flex;justify-content:space-between;margin:2px 0;"><span>Subtotal</span><span>${rupees(data.grandSubtotal)}</span></div>
    ${data.grandTax > 0 ? `<div style="display:flex;justify-content:space-between;margin:2px 0;"><span>Tax</span><span>${rupees(data.grandTax)}</span></div>` : ""}
    ${data.grandDiscount > 0 ? `<div style="display:flex;justify-content:space-between;margin:2px 0;"><span>Discount</span><span>-${rupees(data.grandDiscount)}</span></div>` : ""}

    <div style="text-align:center;margin:4px 0;font-size:${smallSize};">${divider}</div>
    <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:calc(${fontSize} + 1px);margin:3px 0;">
      <span>TOTAL</span><span>${rupees(data.grandTotal)}</span>
    </div>
    ${data.paymentMethod ? `<div style="display:flex;justify-content:space-between;font-size:${smallSize};margin:2px 0;"><span>Payment</span><span>${data.paymentMethod === "ONLINE" ? "Online" : "Cash/Card"}</span></div>` : ""}
    <div style="text-align:center;margin:4px 0;font-size:${smallSize};">${divider}</div>

    <div style="text-align:center;font-size:${smallSize};margin-top:4px;">Thank you! Come again!</div>
    <div style="text-align:center;font-size:${smallSize};">${data.businessName}</div>
    <div style="height:8mm;"></div>
  </div>
</body>
</html>`;
}

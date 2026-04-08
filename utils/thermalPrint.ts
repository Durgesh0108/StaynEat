/**
 * Thermal receipt printing utility.
 * Opens a new browser window optimized for 80mm thermal receipt printers.
 * The user selects their thermal printer in the browser's print dialog.
 */

export interface ThermalBookingData {
  type: "booking";
  businessName: string;
  bookingId: string;
  guestName: string;
  guestPhone: string;
  room?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
}

export interface ThermalFoodBillData {
  type: "food-bill";
  businessName: string;
  billId: string;
  tableNumber?: string;
  roomNumber?: string;
  context: "restaurant" | "hotel";
  orders: Array<{
    index: number;
    time: string;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod?: string;
}

type ThermalData = ThermalBookingData | ThermalFoodBillData;

function rupees(amount: number): string {
  return `Rs.${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function line(char = "-", repeat = 32): string {
  return char.repeat(repeat);
}

function buildBookingHTML(data: ThermalBookingData): string {
  const rows = [
    ["Guest", data.guestName],
    ["Phone", data.guestPhone],
    ...(data.room ? [["Room", data.room] as [string, string]] : []),
    ["Check-in", data.checkIn],
    ["Check-out", data.checkOut],
    ["Nights", String(data.nights)],
  ];

  return `
    <div class="receipt">
      <div class="center bold big">${data.businessName}</div>
      <div class="center small">BOOKING CONFIRMATION</div>
      <div class="center small">${data.bookingId}</div>
      <div class="divider">================================</div>
      ${rows.map(([k, v]) => `<div class="row"><span>${k}</span><span class="right">${v}</span></div>`).join("")}
      <div class="divider">================================</div>
      <div class="row"><span>Room Charges</span><span class="right">${rupees(data.subtotal)}</span></div>
      ${data.tax > 0 ? `<div class="row"><span>Tax</span><span class="right">${rupees(data.tax)}</span></div>` : ""}
      ${data.discount > 0 ? `<div class="row"><span>Discount</span><span class="right">-${rupees(data.discount)}</span></div>` : ""}
      <div class="divider">================================</div>
      <div class="row bold"><span>TOTAL</span><span class="right">${rupees(data.total)}</span></div>
      <div class="row small"><span>Payment</span><span class="right">${data.paymentMethod === "ONLINE" ? "Online" : "Cash/Card"}</span></div>
      <div class="row small"><span>Status</span><span class="right ${data.paymentStatus === "PAID" ? "paid" : "pending"}">${data.paymentStatus}</span></div>
      <div class="divider">================================</div>
      <div class="center small">Thank you for choosing us!</div>
      <div class="center small">Please present this at check-in.</div>
    </div>
  `;
}

function buildFoodBillHTML(data: ThermalFoodBillData): string {
  const locationLine = data.tableNumber
    ? `Table ${data.tableNumber}`
    : data.roomNumber
    ? `Room ${data.roomNumber}`
    : "";

  const ordersHTML = data.orders
    .map(
      (order) => `
      <div class="small muted">Order ${order.index} · ${order.time}</div>
      ${order.items
        .map(
          (item) =>
            `<div class="row"><span>${item.qty}x ${item.name}</span><span class="right">${rupees(item.price)}</span></div>`
        )
        .join("")}
      <div class="row small muted"><span>Order Total</span><span class="right">${rupees(order.total)}</span></div>
      <div class="thin-divider">--------------------------------</div>
    `
    )
    .join("");

  return `
    <div class="receipt">
      <div class="center bold big">${data.businessName}</div>
      <div class="center small">${data.context === "hotel" ? "ROOM SERVICE BILL" : "RESTAURANT BILL"}</div>
      ${locationLine ? `<div class="center small">${locationLine}</div>` : ""}
      <div class="center small">${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
      <div class="divider">================================</div>
      <div class="bold small">ITEMS</div>
      <div class="thin-divider">--------------------------------</div>
      ${ordersHTML}
      <div class="row"><span>Subtotal</span><span class="right">${rupees(data.subtotal)}</span></div>
      ${data.tax > 0 ? `<div class="row"><span>Tax</span><span class="right">${rupees(data.tax)}</span></div>` : ""}
      ${data.discount > 0 ? `<div class="row"><span>Discount</span><span class="right">-${rupees(data.discount)}</span></div>` : ""}
      <div class="divider">================================</div>
      <div class="row bold"><span>TOTAL</span><span class="right">${rupees(data.grandTotal)}</span></div>
      ${data.paymentMethod ? `<div class="row small"><span>Payment</span><span class="right">${data.paymentMethod === "ONLINE" ? "Online" : "Cash/Card"}</span></div>` : ""}
      <div class="divider">================================</div>
      <div class="center small">Thank you! Come again!</div>
      <div class="center small">${data.businessName}</div>
    </div>
  `;
}

export function printThermalReceipt(data: ThermalData): void {
  const bodyHTML =
    data.type === "booking" ? buildBookingHTML(data) : buildFoodBillHTML(data);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt</title>
  <style>
    /* 80mm thermal printer width = ~302px at 96dpi, 58mm = ~220px */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      background: #fff;
      color: #000;
      width: 80mm;
      margin: 0 auto;
      padding: 4mm 4mm 10mm 4mm;
    }
    .receipt { width: 100%; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .big { font-size: 16px; margin-bottom: 2px; }
    .small { font-size: 10px; }
    .muted { color: #555; }
    .paid { color: #166534; font-weight: bold; }
    .pending { color: #854d0e; font-weight: bold; }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      line-height: 1.4;
    }
    .row span:first-child { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 4px; }
    .row span.right { flex-shrink: 0; text-align: right; white-space: nowrap; }
    .divider { text-align: center; margin: 4px 0; letter-spacing: 0; font-size: 11px; }
    .thin-divider { text-align: center; margin: 2px 0; letter-spacing: 0; font-size: 11px; color: #777; }

    @media print {
      body { width: 80mm; margin: 0; padding: 2mm 3mm 8mm 3mm; }
      @page {
        size: 80mm auto;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  ${bodyHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  <\/script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=450,height=700,scrollbars=yes");
  if (!printWindow) {
    alert("Please allow popups to print the receipt.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

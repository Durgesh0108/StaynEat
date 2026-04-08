/**
 * Thermal receipt printing utility.
 *
 * Supported paper sizes:
 *   "80mm"  — Standard retail/supermarket POS printers (80mm / 3⅛")
 *   "57mm"  — Mobile printers & credit card terminals  (57mm / 2¼")
 *
 * Opens a browser print window pre-configured for the chosen paper width.
 * The user selects their thermal printer in the browser print dialog.
 */

export type ThermalPaperSize = "80mm" | "57mm";

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
  return `Rs.${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Config per paper size */
const SIZE_CONFIG = {
  "80mm": {
    pageWidth: "80mm",
    bodyWidth: "72mm",       // printable width after margins
    fontSize: "12px",
    smallSize: "10px",
    bigSize: "15px",
    divider: "================================",   // 32 chars
    thinDivider: "--------------------------------", // 32 chars
    padding: "4mm 4mm 12mm 4mm",
    printPadding: "2mm 4mm 10mm 4mm",
  },
  "57mm": {
    pageWidth: "57mm",
    bodyWidth: "50mm",       // printable width after margins
    fontSize: "10px",
    smallSize: "9px",
    bigSize: "13px",
    divider: "========================",             // 24 chars
    thinDivider: "------------------------",         // 24 chars
    padding: "3mm 3mm 10mm 3mm",
    printPadding: "2mm 3mm 8mm 3mm",
  },
} as const;

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
      <div class="divider">{{DIVIDER}}</div>
      ${rows.map(([k, v]) => `<div class="row"><span>${k}</span><span class="val">${v}</span></div>`).join("")}
      <div class="divider">{{DIVIDER}}</div>
      <div class="row"><span>Room Charges</span><span class="val">${rupees(data.subtotal)}</span></div>
      ${data.tax > 0 ? `<div class="row"><span>Tax</span><span class="val">${rupees(data.tax)}</span></div>` : ""}
      ${data.discount > 0 ? `<div class="row"><span>Discount</span><span class="val">-${rupees(data.discount)}</span></div>` : ""}
      <div class="divider">{{DIVIDER}}</div>
      <div class="row bold total-row"><span>TOTAL</span><span class="val">${rupees(data.total)}</span></div>
      <div class="row small"><span>Payment</span><span class="val">${data.paymentMethod === "ONLINE" ? "Online" : "Cash/Card"}</span></div>
      <div class="row small"><span>Status</span><span class="val ${data.paymentStatus === "PAID" ? "paid" : "pending"}">${data.paymentStatus}</span></div>
      <div class="divider">{{DIVIDER}}</div>
      <div class="center small">Thank you for choosing us!</div>
      <div class="center small">Please present this at check-in.</div>
      <div class="spacer"></div>
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
            `<div class="row"><span>${item.qty}x ${item.name}</span><span class="val">${rupees(item.price)}</span></div>`
        )
        .join("")}
      <div class="row small muted"><span>Order Total</span><span class="val">${rupees(order.total)}</span></div>
      <div class="thin-divider">{{THIN}}</div>
    `
    )
    .join("");

  return `
    <div class="receipt">
      <div class="center bold big">${data.businessName}</div>
      <div class="center small">${data.context === "hotel" ? "ROOM SERVICE BILL" : "RESTAURANT BILL"}</div>
      ${locationLine ? `<div class="center small">${locationLine}</div>` : ""}
      <div class="center small">${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
      <div class="divider">{{DIVIDER}}</div>
      <div class="bold small">ITEMS</div>
      <div class="thin-divider">{{THIN}}</div>
      ${ordersHTML}
      <div class="row"><span>Subtotal</span><span class="val">${rupees(data.subtotal)}</span></div>
      ${data.tax > 0 ? `<div class="row"><span>Tax</span><span class="val">${rupees(data.tax)}</span></div>` : ""}
      ${data.discount > 0 ? `<div class="row"><span>Discount</span><span class="val">-${rupees(data.discount)}</span></div>` : ""}
      <div class="divider">{{DIVIDER}}</div>
      <div class="row bold total-row"><span>TOTAL</span><span class="val">${rupees(data.grandTotal)}</span></div>
      ${data.paymentMethod ? `<div class="row small"><span>Payment</span><span class="val">${data.paymentMethod === "ONLINE" ? "Online" : "Cash/Card"}</span></div>` : ""}
      <div class="divider">{{DIVIDER}}</div>
      <div class="center small">Thank you! Come again!</div>
      <div class="center small">${data.businessName}</div>
      <div class="spacer"></div>
    </div>
  `;
}

export function printThermalReceipt(
  data: ThermalData,
  paperSize: ThermalPaperSize = "80mm"
): void {
  const cfg = SIZE_CONFIG[paperSize];

  const rawHTML =
    data.type === "booking" ? buildBookingHTML(data) : buildFoodBillHTML(data);

  // Inject the correct divider length for the chosen paper size
  const bodyHTML = rawHTML
    .replace(/\{\{DIVIDER\}\}/g, cfg.divider)
    .replace(/\{\{THIN\}\}/g, cfg.thinDivider);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt · ${paperSize}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${cfg.fontSize};
      line-height: 1.45;
      background: #fff;
      color: #000;
      width: ${cfg.bodyWidth};
      margin: 0 auto;
      padding: ${cfg.padding};
    }

    .receipt  { width: 100%; }
    .center   { text-align: center; }
    .bold     { font-weight: bold; }
    .big      { font-size: ${cfg.bigSize}; margin-bottom: 2px; }
    .small    { font-size: ${cfg.smallSize}; }
    .muted    { color: #555; }
    .paid     { font-weight: bold; }
    .pending  { font-weight: bold; }
    .spacer   { height: 8mm; }

    /* Two-column row: label left, value right */
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin: 2px 0;
    }
    .row span:first-child {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 3px;
    }
    .val {
      flex-shrink: 0;
      text-align: right;
      white-space: nowrap;
    }
    .total-row { font-size: calc(${cfg.fontSize} + 1px); }

    .divider      { text-align: center; margin: 3px 0; font-size: ${cfg.smallSize}; letter-spacing: 0; }
    .thin-divider { text-align: center; margin: 2px 0; font-size: ${cfg.smallSize}; color: #777; letter-spacing: 0; }

    /* ---- Print styles ---- */
    @media print {
      body {
        width: ${cfg.pageWidth};
        margin: 0;
        padding: ${cfg.printPadding};
      }
      @page {
        size: ${cfg.pageWidth} auto;   /* auto height = continuous roll */
        margin: 0;
      }
    }
  </style>
</head>
<body>
  ${bodyHTML}
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 350);
    };
  <\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=460,height=720,scrollbars=yes");
  if (!win) {
    alert("Please allow popups to print the receipt.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

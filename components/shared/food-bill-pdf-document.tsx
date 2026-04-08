import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNjXhFVZNyB1W4.woff2",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNjFhFVZNyBx2pqPIif.woff2",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "NotoSans",
    fontSize: 10,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  businessName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  billBadge: {
    fontSize: 9,
    color: "#2563eb",
    backgroundColor: "#dbeafe",
    padding: "4 8",
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    fontSize: 9,
    color: "#6b7280",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderBottomStyle: "solid",
  },
  orderBlock: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 9,
    color: "#6b7280",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemName: {
    flex: 2,
    color: "#374151",
  },
  itemQty: {
    flex: 0.5,
    textAlign: "center",
    color: "#6b7280",
  },
  itemPrice: {
    flex: 1,
    textAlign: "right",
    color: "#111827",
    fontWeight: "bold",
  },
  orderSubtotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    fontSize: 9,
    color: "#6b7280",
  },
  summarySection: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#6b7280",
  },
  summaryValue: {
    color: "#374151",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: "#111827",
    borderTopStyle: "solid",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
  },
  discountValue: {
    color: "#16a34a",
  },
  paymentMethodBadge: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  badge: {
    fontSize: 9,
    fontWeight: "bold",
    padding: "3 8",
    borderRadius: 4,
  },
  onlineBadge: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  offlineBadge: {
    backgroundColor: "#fef9c3",
    color: "#b45309",
  },
  footer: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
  },
  thankYou: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
    marginBottom: 4,
  },
});

function formatAmt(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  menuItem: { name: string };
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface FoodBillPDFDocumentProps {
  orders: Order[];
  totals: {
    grandTotal: number;
    grandSubtotal: number;
    grandTax: number;
    grandDiscount: number;
  };
  businessName: string;
  context: "restaurant" | "hotel";
  tableNumber?: string;
  roomNumber?: string;
  paymentMethod?: "ONLINE" | "OFFLINE";
  sessionId: string;
}

export function FoodBillPDFDocument({
  orders,
  totals,
  businessName,
  context,
  tableNumber,
  roomNumber,
  paymentMethod,
  sessionId,
}: FoodBillPDFDocumentProps) {
  const billId = `#${sessionId.slice(-8).toUpperCase()}`;
  const isOnline = paymentMethod === "ONLINE";

  return (
    <Document title={`Bill ${billId} - ${businessName}`} author={businessName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.billBadge}>{context === "hotel" ? "ROOM SERVICE BILL" : "RESTAURANT BILL"}</Text>
          <View style={styles.meta}>
            <Text>Bill: {billId}</Text>
            {tableNumber && <Text>Table: {tableNumber}</Text>}
            {roomNumber && <Text>Room: {roomNumber}</Text>}
            <Text>Date: {format(new Date(), "dd MMM yyyy")}</Text>
            <Text>Time: {format(new Date(), "hh:mm a")}</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details ({orders.length} order{orders.length !== 1 ? "s" : ""})</Text>

          {/* Column headers */}
          <View style={[styles.itemRow, { marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid", paddingBottom: 4 }]}>
            <Text style={[styles.itemName, { fontWeight: "bold", color: "#374151" }]}>Item</Text>
            <Text style={[styles.itemQty, { fontWeight: "bold", color: "#374151" }]}>Qty</Text>
            <Text style={[styles.itemPrice, { fontWeight: "bold", color: "#374151" }]}>Amount</Text>
          </View>

          {orders.map((order, idx) => (
            <View key={order.id} style={styles.orderBlock}>
              <View style={styles.orderHeader}>
                <Text>Order {idx + 1}  ·  {format(new Date(order.createdAt), "hh:mm a")}</Text>
                <Text style={{ color: order.status === "DELIVERED" ? "#16a34a" : "#b45309" }}>
                  {order.status}
                </Text>
              </View>

              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.menuItem.name}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatAmt(item.totalPrice)}</Text>
                </View>
              ))}

              <View style={styles.orderSubtotal}>
                <Text>Order Total</Text>
                <Text style={{ fontWeight: "bold", color: "#374151" }}>{formatAmt(order.totalAmount)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Grand Total */}
        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Grand Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatAmt(totals.grandSubtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax & Charges</Text>
            <Text style={styles.summaryValue}>{formatAmt(totals.grandTax)}</Text>
          </View>
          {totals.grandDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>- {formatAmt(totals.grandDiscount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatAmt(totals.grandTotal)}</Text>
          </View>

          {paymentMethod && (
            <View style={styles.paymentMethodBadge}>
              <Text style={styles.badgeLabel}>Payment:</Text>
              <Text style={[styles.badge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
                {isOnline ? "Online Payment" : "Cash / Card"}
              </Text>
            </View>
          )}
        </View>

        {/* Thank you */}
        <Text style={styles.thankYou}>Thank you for your visit!</Text>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated bill.{"\n"}
          Generated on {format(new Date(), "dd MMM yyyy, hh:mm a")} · {businessName}
        </Text>
      </Page>
    </Document>
  );
}

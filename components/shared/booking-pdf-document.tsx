import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Register a font that supports the Rupee symbol
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
    marginBottom: 24,
    paddingBottom: 16,
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
  confirmationBadge: {
    fontSize: 9,
    color: "#16a34a",
    backgroundColor: "#dcfce7",
    padding: "4 8",
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  bookingId: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderBottomStyle: "solid",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    color: "#6b7280",
    flex: 1,
  },
  value: {
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
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
  paymentBadge: {
    padding: "3 8",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  paymentPaid: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  paymentPending: {
    backgroundColor: "#fef9c3",
    color: "#b45309",
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
  },
  note: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
});

function formatAmt(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

interface BookingPDFDocumentProps {
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

export function BookingPDFDocument({ booking, businessName }: BookingPDFDocumentProps) {
  const bookingId = `#${booking.id.slice(-8).toUpperCase()}`;
  const isPaid = booking.paymentStatus === "PAID";

  return (
    <Document title={`Booking ${bookingId} - ${businessName}`} author={businessName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.confirmationBadge}>BOOKING CONFIRMED</Text>
          <Text style={styles.bookingId}>Booking ID: {bookingId}</Text>
        </View>

        {/* Guest Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Guest Name</Text>
            <Text style={styles.value}>{booking.guestName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{booking.guestPhone}</Text>
          </View>
          {booking.guestEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{booking.guestEmail}</Text>
            </View>
          )}
        </View>

        {/* Room & Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room & Stay Details</Text>
          {booking.room && (
            <View style={styles.row}>
              <Text style={styles.label}>Room</Text>
              <Text style={styles.value}>{booking.room.name} (#{booking.room.roomNumber})</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>{fmtDate(booking.checkIn)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>{fmtDate(booking.checkOut)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{booking.nights} night{booking.nights !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Room Charges</Text>
            <Text style={styles.value}>{formatAmt(booking.totalAmount)}</Text>
          </View>
          {booking.taxAmount !== undefined && booking.taxAmount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Tax & Fees</Text>
              <Text style={styles.value}>{formatAmt(booking.taxAmount)}</Text>
            </View>
          )}
          {booking.discountAmount !== undefined && booking.discountAmount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Discount</Text>
              <Text style={[styles.value, { color: "#16a34a" }]}>- {formatAmt(booking.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatAmt(booking.finalAmount)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Payment Status</Text>
            <Text style={[styles.paymentBadge, isPaid ? styles.paymentPaid : styles.paymentPending]}>
              {isPaid ? "PAID" : "PAYMENT PENDING"}
            </Text>
          </View>
          {booking.paymentMethod && (
            <View style={styles.row}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>{booking.paymentMethod === "ONLINE" ? "Online Payment" : "Pay at Check-in"}</Text>
            </View>
          )}
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text>Please carry this booking confirmation at check-in. Present it to the front desk along with a valid photo ID. Check-in time may vary — please contact the hotel for early check-in arrangements.</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated booking confirmation. No signature required.{"\n"}
          Generated on {format(new Date(), "dd MMM yyyy, hh:mm a")} · {businessName}
        </Text>
      </Page>
    </Document>
  );
}

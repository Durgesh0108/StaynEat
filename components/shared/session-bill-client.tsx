"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCartStore } from "@/stores/cartStore";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { CheckCircle, Clock, Receipt, ChefHat, BedDouble } from "lucide-react";

const RazorpayCheckout = dynamic(
  () => import("@/components/shared/razorpay-checkout").then((m) => m.RazorpayCheckout),
  { ssr: false }
);

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  menuItem: { name: string; image?: string | null };
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

interface SessionBillClientProps {
  sessionId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  context: "restaurant" | "hotel";
  tableNumber?: string;
  roomNumber?: string;
  settings: { acceptOnlinePayment: boolean; acceptOfflinePayment: boolean } | null;
}

export function SessionBillClient({
  sessionId,
  businessId,
  businessName,
  businessSlug,
  context,
  tableNumber,
  roomNumber,
  settings,
}: SessionBillClientProps) {
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totals, setTotals] = useState({ grandTotal: 0, grandSubtotal: 0, grandTax: 0, grandDiscount: 0, unpaidTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "OFFLINE">(
    settings?.acceptOnlinePayment ? "ONLINE" : "OFFLINE"
  );
  const [razorpayOrder, setRazorpayOrder] = useState<{ id: string; amount: number; currency: string } | null>(null);
  const [paid, setPaid] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/session?sessionId=${sessionId}&businessId=${businessId}`);
      const json = await res.json();
      setOrders(json.orders ?? []);
      setTotals({
        grandTotal: json.grandTotal ?? 0,
        grandSubtotal: json.grandSubtotal ?? 0,
        grandTax: json.grandTax ?? 0,
        grandDiscount: json.grandDiscount ?? 0,
        unpaidTotal: json.unpaidTotal ?? 0,
      });
    } catch {
      toast.error("Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [sessionId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/orders/session-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, businessId, paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      if (paymentMethod === "ONLINE" && json.razorpayOrder) {
        setRazorpayOrder(json.razorpayOrder);
      } else {
        setPaid(true);
        clearCart();
        toast.success("Payment confirmed! Thank you.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handleRazorpaySuccess = async (paymentId: string) => {
    try {
      await fetch("/api/orders/session-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, businessId, paymentMethod: "ONLINE", razorpayPaymentId: paymentId }),
      });
      setPaid(true);
      clearCart();
      toast.success("Payment successful! Thank you.");
    } catch {
      toast.error("Payment verification failed");
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    PENDING: "text-amber-600",
    CONFIRMED: "text-blue-600",
    PREPARING: "text-orange-600",
    READY: "text-primary-600",
    DELIVERED: "text-success-600",
    CANCELLED: "text-danger-600",
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-success-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Paid!</h2>
          <p className="text-gray-500">Thank you for dining with us. Hope to see you again!</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Total paid: {formatCurrency(totals.grandTotal)}
          </p>
          <a
            href={context === "restaurant" ? `/r/${businessSlug}` : `/h/${businessSlug}`}
            className="btn-primary inline-block mt-4"
          >
            Back to {businessName}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {razorpayOrder && (
        <RazorpayCheckout
          order={razorpayOrder}
          name={businessName}
          onSuccess={(paymentId) => handleRazorpaySuccess(paymentId)}
          onError={() => setRazorpayOrder(null)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-5 w-5 text-primary-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your Bill</h1>
          </div>
          <p className="text-sm text-gray-500">{businessName}</p>
          {tableNumber && <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">Table {tableNumber}</p>}
          {roomNumber && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5 flex items-center gap-1">
              <BedDouble className="h-3 w-3" />Room {roomNumber} · Room Service
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="card h-32 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            <ChefHat className="h-10 w-10 mx-auto mb-3 text-gray-200" />
            <p>No orders placed yet</p>
          </div>
        ) : (
          <>
            {/* Order rounds */}
            <div className="space-y-3">
              {orders.map((order, idx) => (
                <div key={order.id} className="card overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Order {idx + 1}</span>
                      <span className="text-xs text-gray-400">· {format(new Date(order.createdAt), "hh:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium flex items-center gap-1 ${STATUS_COLOR[order.status] ?? ""}`}>
                        <Clock className="h-3 w-3" />{order.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.paymentStatus === "PAID" ? "bg-success-100 text-success-700" : "bg-amber-100 text-amber-700"}`}>
                        {order.paymentStatus === "PAID" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{item.quantity}× {item.menuItem.name}</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span>Order total</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="card p-5 space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Grand Total</h3>
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatCurrency(totals.grandSubtotal)}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>{formatCurrency(totals.grandTax)}</span></div>
              {totals.grandDiscount > 0 && <div className="flex justify-between text-sm text-success-600"><span>Discounts</span><span>-{formatCurrency(totals.grandDiscount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span className="text-primary-600 dark:text-primary-400">{formatCurrency(totals.grandTotal)}</span>
              </div>
              {totals.unpaidTotal < totals.grandTotal && (
                <div className="flex justify-between text-sm text-success-600 font-medium">
                  <span>Already paid</span>
                  <span>{formatCurrency(totals.grandTotal - totals.unpaidTotal)}</span>
                </div>
              )}
              {totals.unpaidTotal > 0 && (
                <div className="flex justify-between font-semibold text-danger-600">
                  <span>Amount due</span>
                  <span>{formatCurrency(totals.unpaidTotal)}</span>
                </div>
              )}
            </div>

            {/* Payment */}
            {totals.unpaidTotal > 0 && (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {settings?.acceptOnlinePayment && (
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === "ONLINE" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                      <input type="radio" checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")} className="accent-primary-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Pay Online</span>
                    </label>
                  )}
                  {settings?.acceptOfflinePayment && (
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === "OFFLINE" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                      <input type="radio" checked={paymentMethod === "OFFLINE"} onChange={() => setPaymentMethod("OFFLINE")} className="accent-primary-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Cash / Card</span>
                    </label>
                  )}
                </div>
                <button onClick={handlePay} disabled={paying} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {paying ? "Processing..." : `Pay ${formatCurrency(totals.unpaidTotal)}`}
                </button>
              </div>
            )}

            {totals.unpaidTotal === 0 && (
              <div className="card p-5 flex items-center gap-3 bg-success-50 dark:bg-success-900/20">
                <CheckCircle className="h-6 w-6 text-success-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-success-700 dark:text-success-400">All orders paid!</p>
                  <p className="text-xs text-success-600 mt-0.5">Thank you for your visit.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/cartStore";
import { Trash2, Tag, CheckCircle, ShoppingBag, BedDouble } from "lucide-react";
import dynamic from "next/dynamic";

const RazorpayCheckout = dynamic(
  () => import("@/components/shared/razorpay-checkout").then((m) => m.RazorpayCheckout),
  { ssr: false }
);

const schema = z.object({
  guestName: z.string().min(2, "Name required"),
  guestPhone: z.string().min(10, "Valid phone required"),
  specialInstructions: z.string().optional(),
  paymentMethod: z.enum(["ONLINE", "OFFLINE"]),
});

type FormData = z.infer<typeof schema>;

interface HotelCheckoutClientProps {
  business: {
    id: string;
    slug: string;
    name: string;
    settings: {
      taxPercentage: number;
      acceptOnlinePayment: boolean;
      acceptOfflinePayment: boolean;
    } | null;
  };
  room: { id: string; roomNumber: string; name: string } | null;
}

export function HotelCheckoutClient({ business, room }: HotelCheckoutClientProps) {
  const router = useRouter();
  const { items, getSubtotal, getTaxAmount, getTotal, getItemCount, couponCode, discount, applyCoupon, removeCoupon, clearCart } = useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<{ id: string; amount: number; currency: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: business.settings?.acceptOnlinePayment ? "ONLINE" : "OFFLINE" },
  });

  const paymentMethod = watch("paymentMethod");
  const taxRate = business.settings?.taxPercentage ?? 5;
  const subtotal = getSubtotal();
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax - discount;

  const validateCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponInput}&businessId=${business.id}&amount=${subtotal}`);
      const json = await res.json();
      if (json.valid) { applyCoupon(couponInput.toUpperCase(), json.discount); toast.success(json.message); }
      else toast.error(json.message);
    } catch { toast.error("Failed to validate coupon"); }
    finally { setValidatingCoupon(false); }
  };

  const placeOrder = async (data: FormData) => {
    if (items.length === 0) return toast.error("Your cart is empty");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          roomId: room?.id ?? undefined,
          items: items.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            unitPrice: i.menuItem.price,
            totalPrice: i.menuItem.price * i.quantity,
          })),
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          specialInstructions: data.specialInstructions,
          type: "ROOM_SERVICE",
          paymentMethod: data.paymentMethod,
          subtotal: getSubtotal(),
          taxAmount: Math.round((getSubtotal() * taxRate) / 100),
          discountAmount: discount,
          totalAmount: Math.max(0, getSubtotal() + Math.round((getSubtotal() * taxRate) / 100) - discount),
          couponCode: couponCode ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to place order");

      if (data.paymentMethod === "ONLINE" && json.razorpayOrderId) {
        setOrderId(json.id);
        setRazorpayOrder({ id: json.razorpayOrderId, amount: json.totalAmount, currency: "INR" });
      } else {
        clearCart();
        router.push(`/h/${business.slug}/order/${json.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally { setLoading(false); }
  };

  const handlePaymentSuccess = async (paymentId: string, signature: string) => {
    if (!orderId || !razorpayOrder) return;
    try {
      await fetch("/api/orders/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, razorpayOrderId: razorpayOrder.id, razorpayPaymentId: paymentId, razorpaySignature: signature }),
      });
      clearCart();
      router.push(`/h/${business.slug}/order/${orderId}`);
    } catch { toast.error("Payment verification failed"); }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
          <a href={`/h/${business.slug}/menu${room ? `?room=${room.roomNumber}` : ""}`} className="btn-primary text-sm">Browse Menu</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {razorpayOrder && (
        <RazorpayCheckout order={razorpayOrder} name={business.name} onSuccess={handlePaymentSuccess} onError={() => setRazorpayOrder(null)} />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <a href={`/h/${business.slug}/menu${room ? `?room=${room.roomNumber}` : ""}`} className="text-gray-400 hover:text-gray-600">←</a>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Room Service Checkout</h1>
            {room && (
              <p className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" />Room {room.roomNumber} · {room.name}
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Order ({getItemCount()} items)</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.menuItem.id} className="flex items-center gap-3">
                {item.menuItem.image && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={item.menuItem.image} alt={item.menuItem.name} width={48} height={48} className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.menuItem.name}</p>
                  <p className="text-xs text-gray-500">×{item.quantity} · ₹{item.menuItem.price} each</p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">₹{(item.menuItem.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary-500" />Coupon
          </h2>
          {couponCode ? (
            <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-500" />
                <span className="text-sm font-medium text-success-700 dark:text-success-400">{couponCode} applied</span>
                <span className="text-sm text-success-600">-₹{discount}</span>
              </div>
              <button onClick={removeCoupon} className="text-danger-500 hover:text-danger-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input flex-1 text-sm uppercase" onKeyDown={(e) => e.key === "Enter" && validateCoupon()} />
              <button onClick={validateCoupon} disabled={validatingCoupon || !couponInput.trim()} className="btn-secondary text-sm px-4">
                {validatingCoupon ? "..." : "Apply"}
              </button>
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="card p-5 space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300"><span>GST ({taxRate}%)</span><span>₹{tax.toFixed(0)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-success-600"><span>Discount</span><span>-₹{discount}</span></div>}
          <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span><span>₹{Math.max(0, total).toFixed(0)}</span>
          </div>
        </div>

        {/* Guest Form */}
        <form onSubmit={handleSubmit(placeOrder)} className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Guest Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input {...register("guestName")} className="input" placeholder="Your name" />
              {errors.guestName && <p className="text-danger-500 text-xs mt-1">{errors.guestName.message}</p>}
            </div>
            <div>
              <label className="label">Phone *</label>
              <input {...register("guestPhone")} className="input" placeholder="9876543210" />
              {errors.guestPhone && <p className="text-danger-500 text-xs mt-1">{errors.guestPhone.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Special Instructions</label>
            <textarea {...register("specialInstructions")} rows={2} className="input resize-none" placeholder="Allergies, preferences, delivery time..." />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {business.settings?.acceptOnlinePayment && (
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === "ONLINE" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                  <input {...register("paymentMethod")} type="radio" value="ONLINE" className="accent-primary-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Online</span>
                </label>
              )}
              {business.settings?.acceptOfflinePayment && (
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === "OFFLINE" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                  <input {...register("paymentMethod")} type="radio" value="OFFLINE" className="accent-primary-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Cash / Card on Delivery</span>
                </label>
              )}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? "Placing Order..." : `Place Room Service Order · ₹${Math.max(0, total).toFixed(0)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

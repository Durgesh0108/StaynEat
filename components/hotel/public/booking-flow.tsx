"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  BedDouble,
  Users,
  Tag,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format, differenceInDays } from "date-fns";
import { formatCurrency } from "@/utils/formatCurrency";
import { RazorpayCheckout } from "@/components/shared/razorpay-checkout";
import { BookingReceipt } from "@/components/shared/booking-receipt";

const guestSchema = z.object({
  guestName: z.string().min(2, "Name required"),
  guestPhone: z.string().min(10, "Valid phone required"),
  guestEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(10),
  specialRequests: z.string().optional(),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface BookingFlowProps {
  business: {
    id: string;
    slug: string;
    name: string;
    logo?: string | null;
    settings?: {
      acceptOnlinePayment: boolean;
      acceptOfflinePayment: boolean;
      taxPercentage: number;
      checkInTime: string;
      checkOutTime: string;
    } | null;
  };
  room: {
    id: string;
    name: string;
    roomNumber: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
    images: string[];
    amenities: string[];
  };
  checkInStr?: string;
  checkOutStr?: string;
}

export function BookingFlow({ business, room, checkInStr, checkOutStr }: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState(checkInStr ?? format(new Date(), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(checkOutStr ?? format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    razorpayOrderId?: string;
  } | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Record<string, unknown> | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<{ id: string; amount: number; currency: string } | null>(null);

  const nights = differenceInDays(new Date(checkOut), new Date(checkIn)) || 1;
  const subtotal = room.pricePerNight * nights;
  const taxRate = business.settings?.taxPercentage ?? 18;
  const taxAmount = (subtotal * taxRate) / 100;
  const discountAmount = couponApplied ? discount : 0;
  const total = subtotal + taxAmount - discountAmount;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: { adults: 2, children: 0 },
  });

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch(
        `/api/coupons/validate?code=${couponCode}&businessId=${business.id}&amount=${subtotal}`
      );
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setCouponApplied(true);
        toast.success(`Coupon applied! Saved ${formatCurrency(data.discount)}`);
      } else {
        toast.error(data.message ?? "Invalid coupon");
      }
    } catch {
      toast.error("Failed to apply coupon");
    }
  };

  const createBooking = async (formData: GuestFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          roomId: room.id,
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          nights,
          ...formData,
          paymentMethod,
          couponCode: couponApplied ? couponCode : undefined,
          discountAmount,
          totalAmount: subtotal,
          taxAmount,
          finalAmount: total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      if (paymentMethod === "ONLINE" && data.razorpayOrder) {
        setBookingResult({ id: data.bookingId, razorpayOrderId: data.razorpayOrder.id });
        setRazorpayOrder(data.razorpayOrder);
        setStep(4);
      } else {
        setConfirmedBooking(data.booking);
        setStep(5);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, signature: string) => {
    try {
      const res = await fetch("/api/bookings/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingResult?.id,
          razorpayOrderId: bookingResult?.razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmedBooking(data.booking);
        setStep(5);
      } else {
        toast.error("Payment verification failed");
      }
    } catch {
      toast.error("Payment verification error");
    }
  };

  const steps = ["Dates", "Your Details", "Payment", "Confirm", "Booked!"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/h/${business.slug}`} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{business.name}</p>
              <p className="text-xs text-gray-400">Booking {room.name}</p>
            </div>
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-1">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i + 1 < step ? "bg-success-500 text-white" :
                    i + 1 === step ? "bg-primary-500 text-white" :
                    "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}>
                    {i + 1 < step ? "✓" : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-6 h-0.5 ${i + 1 < step ? "bg-success-300" : "bg-gray-200 dark:bg-gray-700"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Step 1: Dates */}
            {step === 1 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-500" /> Select Dates
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="label">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (e.target.value >= checkOut) {
                          const d = new Date(e.target.value);
                          d.setDate(d.getDate() + 1);
                          setCheckOut(format(d, "yyyy-MM-dd"));
                        }
                      }}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div className="p-3 bg-primary-50 dark:bg-primary-950 rounded-xl text-sm text-primary-700 dark:text-primary-300 mb-6">
                  <strong>{nights} night{nights > 1 ? "s" : ""}</strong> ·{" "}
                  Check-in {business.settings?.checkInTime ?? "14:00"} · Check-out {business.settings?.checkOutTime ?? "11:00"}
                </div>
                <button onClick={() => setStep(2)} className="btn-primary w-full">
                  Continue <ChevronRight className="h-4 w-4 inline" />
                </button>
              </div>
            )}

            {/* Step 2: Guest Details */}
            {step === 2 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-500" /> Your Details
                </h2>
                <form onSubmit={handleSubmit(() => setStep(3))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name *</label>
                      <input {...register("guestName")} placeholder="John Doe" className="input" />
                      {errors.guestName && <p className="text-danger-500 text-xs mt-1">{errors.guestName.message}</p>}
                    </div>
                    <div>
                      <label className="label">Phone *</label>
                      <input {...register("guestPhone")} placeholder="9876543210" className="input" />
                      {errors.guestPhone && <p className="text-danger-500 text-xs mt-1">{errors.guestPhone.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="label">Email (optional)</label>
                    <input {...register("guestEmail")} type="email" placeholder="john@example.com" className="input" />
                    {errors.guestEmail && <p className="text-danger-500 text-xs mt-1">{errors.guestEmail.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Adults</label>
                      <select {...register("adults", { valueAsNumber: true })} className="input">
                        {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Children</label>
                      <select {...register("children", { valueAsNumber: true })} className="input">
                        {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Special Requests (optional)</label>
                    <textarea {...register("specialRequests")} rows={2} placeholder="Any special requests..." className="input resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                    <button type="submit" className="btn-primary flex-1">Continue</button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary-500" /> Payment
                </h2>

                {/* Coupon */}
                <div className="mb-5">
                  <label className="label">Coupon Code</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(false); setDiscount(0); }}
                        placeholder="SAVE20"
                        className="input pl-9"
                        disabled={couponApplied}
                      />
                    </div>
                    <button onClick={applyCoupon} disabled={couponApplied} className="btn-secondary px-4 whitespace-nowrap">
                      {couponApplied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2 mb-6">
                  {business.settings?.acceptOnlinePayment && (
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "ONLINE" ? "border-primary-500 bg-primary-50 dark:bg-primary-950" : "border-gray-200 dark:border-gray-700"
                    }`}>
                      <input
                        type="radio"
                        value="ONLINE"
                        checked={paymentMethod === "ONLINE"}
                        onChange={() => setPaymentMethod("ONLINE")}
                        className="accent-primary-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Pay Online</p>
                        <p className="text-xs text-gray-500">UPI, Cards, Net Banking via Razorpay</p>
                      </div>
                    </label>
                  )}
                  {business.settings?.acceptOfflinePayment && (
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "OFFLINE" ? "border-primary-500 bg-primary-50 dark:bg-primary-950" : "border-gray-200 dark:border-gray-700"
                    }`}>
                      <input
                        type="radio"
                        value="OFFLINE"
                        checked={paymentMethod === "OFFLINE"}
                        onChange={() => setPaymentMethod("OFFLINE")}
                        className="accent-primary-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Pay at Check-in</p>
                        <p className="text-xs text-gray-500">Cash or card when you arrive</p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                  <button
                    onClick={() => handleSubmit(createBooking)()}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {paymentMethod === "ONLINE" ? "Proceed to Pay" : "Confirm Booking"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Razorpay */}
            {step === 4 && razorpayOrder && (
              <div className="card p-6 text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complete Payment</h2>
                <p className="text-gray-500 text-sm mb-6">You will be redirected to the secure payment gateway.</p>
                <RazorpayCheckout
                  order={razorpayOrder}
                  name={business.name}
                  prefill={{
                    name: getValues("guestName"),
                    contact: getValues("guestPhone"),
                    email: getValues("guestEmail") ?? "",
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={() => toast.error("Payment failed. Please try again.")}
                />
              </div>
            )}

            {/* Step 5: Confirmation */}
            {step === 5 && confirmedBooking && (
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-success-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
                <p className="text-gray-500 text-sm mb-6">Your room has been successfully booked.</p>
                <BookingReceipt booking={confirmedBooking as Parameters<typeof BookingReceipt>[0]["booking"]} businessName={business.name} />
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div>
            <div className="card p-4 sticky top-20">
              <div className="relative h-36 rounded-xl overflow-hidden mb-3">
                <Image
                  src={room.images[0] ?? "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"}
                  alt={room.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{room.name}</h3>
              <p className="text-xs text-gray-400 mb-3">Room {room.roomNumber}</p>

              <div className="space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{formatCurrency(room.pricePerNight)} × {nights} night{nights > 1 ? "s" : ""}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-success-600">
                    <span>Discount</span>
                    <span>−{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Total</span>
                  <span className="text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

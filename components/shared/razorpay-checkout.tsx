"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
}

interface RazorpayCheckoutProps {
  order: { id: string; amount: number; currency: string };
  name: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (paymentId: string, signature: string) => void;
  onError: () => void;
}

export function RazorpayCheckout({ order, name, prefill, onSuccess, onError }: RazorpayCheckoutProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name,
        order_id: order.id,
        prefill,
        theme: { color: "#6C3EF4" },
        handler(response) {
          onSuccess(response.razorpay_payment_id, response.razorpay_signature);
        },
        modal: {
          ondismiss() {
            toast.error("Payment cancelled");
            onError();
          },
        },
      });
      rzp.open();
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      <p className="text-sm text-gray-500">Opening payment gateway...</p>
    </div>
  );
}

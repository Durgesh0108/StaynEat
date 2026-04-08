"use client";

import { useState } from "react";
import { MessageCircle, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface WhatsAppBillShareProps {
  type: "booking" | "food-bill";
  bookingId?: string;
  sessionId?: string;
  businessId?: string;
  /** Pre-fill if the guest entered their phone during checkout */
  defaultPhone?: string;
}

export function WhatsAppBillShare({
  type,
  bookingId,
  sessionId,
  businessId,
  defaultPhone = "",
}: WhatsAppBillShareProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 10) {
      toast.error("Enter a valid WhatsApp number");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          phone,
          bookingId,
          sessionId,
          businessId,
          baseUrl: window.location.origin,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send");
      setSent(true);
      toast.success("Bill sent on WhatsApp!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>Bill sent to <strong>{phone}</strong> on WhatsApp</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">
        Send bill on WhatsApp <span className="text-gray-400">(optional)</span>
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">+91</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
            placeholder="9876543210"
            maxLength={10}
            className="input pl-10 text-sm"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending || phone.replace(/[^\d]/g, "").length < 10}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-xl transition-colors whitespace-nowrap"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

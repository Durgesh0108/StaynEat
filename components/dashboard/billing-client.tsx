"use client";

import { useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Clock, CreditCard, Zap, Crown, RefreshCw, AlertTriangle } from "lucide-react";
import { ConfirmModal } from "@/components/ui/modal";

interface Business {
  id: string;
  name: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  trialEndsAt: Date | null;
}

const PLANS = [
  {
    id: "MONTHLY",
    name: "Monthly",
    price: 999,
    features: [
      "Unlimited Rooms / Tables",
      "Hotel & Restaurant Management",
      "Online Booking & Ordering",
      "Razorpay Payment Integration",
      "QR Code Generation",
      "Analytics & Reports",
      "API Access",
      "Email Support",
    ],
  },
  {
    id: "YEARLY",
    name: "Yearly",
    price: 9999,
    savings: "Save ₹1,989",
    popular: true,
    features: [
      "Everything in Monthly",
      "Priority Support",
      "Custom Domain (coming soon)",
      "White-label Receipts",
      "Staff Accounts",
      "Advanced Analytics",
      "Dedicated Account Manager",
      "SLA Guarantee",
    ],
  },
];

export function BillingClient({ business }: { business: Business }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const status = business.subscriptionStatus;
  const isActive = status === "ACTIVE";
  const isTrial = status === "TRIAL";
  const trialDaysLeft = business.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(business.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, businessId: business.id }),
      });
      const json = await res.json();
      if (json.subscriptionId) {
        // Load Razorpay
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.head.appendChild(script);
        script.onload = () => {
          const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            subscription_id: json.subscriptionId,
            name: "HospitPro",
            description: `${plan === "YEARLY" ? "Yearly" : "Monthly"} Subscription`,
            image: "/logo.png",
            theme: { color: "#6C3EF4" },
            prefill: { name: business.name },
            handler: () => {
              toast.success("Subscription activated! Refreshing...");
              setTimeout(() => window.location.reload(), 2000);
            },
          });
          rzp.open();
        };
      } else {
        toast.error(json.error ?? "Failed to create subscription");
      }
    } catch {
      toast.error("Failed to initiate subscription");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setLoading("cancel");
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (res.ok) {
        toast.success("Subscription cancellation requested");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("Failed to cancel subscription");
      }
    } catch {
      toast.error("Failed to cancel subscription");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => { setCancelConfirmOpen(false); handleCancel(); }}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription? You will lose access at the end of the billing period."
        confirmLabel="Cancel Subscription"
        cancelLabel="Keep Plan"
        variant="danger"
        loading={loading === "cancel"}
      />
      {/* Current Status */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Current Plan</h3>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isActive ? "bg-success-100 dark:bg-success-900/30" :
              isTrial ? "bg-amber-100 dark:bg-amber-900/30" :
              "bg-gray-100 dark:bg-gray-800"
            }`}>
              {isActive ? <CheckCircle className="h-5 w-5 text-success-600" /> :
               isTrial ? <Clock className="h-5 w-5 text-amber-600" /> :
               <XCircle className="h-5 w-5 text-gray-400" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {isActive
                  ? `${business.subscriptionPlan === "YEARLY" ? "Yearly" : "Monthly"} Plan`
                  : isTrial
                  ? "Free Trial"
                  : "No Active Plan"}
              </p>
              <p className="text-xs text-gray-500">
                {isActive && business.subscriptionEndDate
                  ? `Renews on ${format(new Date(business.subscriptionEndDate), "dd MMM yyyy")}`
                  : isTrial && business.trialEndsAt
                  ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}`
                  : status === "CANCELLED"
                  ? "Subscription cancelled"
                  : status === "EXPIRED"
                  ? "Subscription expired"
                  : "Subscribe to unlock all features"}
              </p>
            </div>
          </div>
          <span className={`badge ${
            isActive ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400" :
            isTrial ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
            {status ?? "NONE"}
          </span>
        </div>

        {isTrial && trialDaysLeft <= 3 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Your trial expires soon. Subscribe now to keep using HospitPro without interruption.
            </p>
          </div>
        )}

        {isActive && (
          <button
            onClick={() => setCancelConfirmOpen(true)}
            disabled={loading === "cancel"}
            className="mt-4 text-xs text-danger-600 hover:underline flex items-center gap-1"
          >
            {loading === "cancel" && <RefreshCw className="h-3 w-3 animate-spin" />}
            Cancel subscription
          </button>
        )}
      </div>

      {/* Plans */}
      {!isActive && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Choose a Plan</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`card p-5 relative ${
                  plan.popular ? "ring-2 ring-primary-500" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {plan.id === "YEARLY" ? (
                      <Zap className="h-4 w-4 text-primary-500" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-primary-500" />
                    )}
                    <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{plan.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      /{plan.id === "YEARLY" ? "year" : "month"}
                    </span>
                  </div>
                  {plan.savings && (
                    <span className="text-xs text-success-600 font-medium">{plan.savings}</span>
                  )}
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-3.5 w-3.5 text-success-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`w-full ${plan.popular ? "btn-primary" : "btn-secondary"} flex items-center justify-center gap-2 text-sm`}
                >
                  {loading === plan.id && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Subscribe {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features included */}
      {isActive && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Your Plan Includes</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Unlimited Rooms & Tables",
              "Online Booking System",
              "Menu Management",
              "QR Code Menus",
              "Razorpay Payments",
              "Analytics Dashboard",
              "Coupon Management",
              "API Access",
              "Email Notifications",
              "Staff Accounts",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-3.5 w-3.5 text-success-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing history note */}
      <div className="card p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Billing is managed through Razorpay. For invoices and payment history, visit your{" "}
          <a
            href="https://dashboard.razorpay.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline"
          >
            Razorpay Dashboard
          </a>
          . For billing support, email{" "}
          <a href="mailto:billing@hospitpro.com" className="text-primary-600 dark:text-primary-400 underline">
            billing@hospitpro.com
          </a>
        </p>
      </div>
    </div>
  );
}

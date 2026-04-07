"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Hotel,
  UtensilsCrossed,
  CreditCard,
  QrCode,
  BarChart3,
  Shield,
  Star,
  Check,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Globe,
  Smartphone,
  Zap,
  Users,
  Building,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils/cn";

const features = [
  {
    icon: Hotel,
    title: "Hotel Management",
    description: "Manage rooms, bookings, check-ins, and guest experience from one place.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurant Management",
    description: "Digital menus, QR ordering, kitchen display, and real-time order tracking.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: CreditCard,
    title: "Online Payments",
    description: "Razorpay integration for secure online payments with instant confirmation.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: QrCode,
    title: "QR Code Ordering",
    description: "Guests scan QR codes to view menus and place orders without any app.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Revenue trends, occupancy rates, and business insights at your fingertips.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with 99.9% uptime SLA for your business.",
    color: "bg-teal-50 text-teal-600",
  },
];

const plans = [
  {
    name: "Monthly",
    price: { monthly: 999, yearly: 999 },
    description: "Perfect for getting started",
    features: [
      "1 Property (Hotel or Restaurant)",
      "Unlimited bookings & orders",
      "Online payment integration",
      "QR code menu & ordering",
      "Basic analytics",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Yearly",
    price: { monthly: 9999, yearly: 9999 },
    description: "Best value — save 17%",
    features: [
      "Everything in Monthly",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Dedicated account manager",
    ],
    popular: true,
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, The Grand Palace Hotel",
    text: "HospitPro transformed how we manage bookings. Online payments, automated confirmations — it's a game changer!",
    rating: 5,
    avatar: "RK",
  },
  {
    name: "Priya Sharma",
    role: "Manager, Spice Garden Restaurant",
    text: "Our table turnover increased by 30% after implementing QR ordering. Customers love the seamless experience.",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Amit Patel",
    role: "Owner, Sunset Resort",
    text: "The analytics dashboard helps me understand my business better. Revenue reports are spot on.",
    rating: 5,
    avatar: "AP",
  },
];

const faqs = [
  {
    q: "Do I need technical knowledge to use HospitPro?",
    a: "Not at all! HospitPro is designed for non-technical users. The setup wizard guides you through everything in minutes.",
  },
  {
    q: "Can I use it for both a hotel and restaurant?",
    a: "Yes! If you have a hotel with a restaurant, you can enable both modules under one subscription.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, we offer a 14-day free trial with full access to all features. No credit card required.",
  },
  {
    q: "How do online payments work?",
    a: "We use Razorpay for secure payment processing. Your guests can pay via UPI, cards, or net banking.",
  },
  {
    q: "Can I customize my public page?",
    a: "Yes! You can add your logo, photos, description, and customize colors to match your brand.",
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">{q}</span>
        <ChevronDown
          className={cn("h-5 w-5 text-gray-400 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">HospitPro</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</Link>
              <Link href="#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</Link>
              <Link href="#faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">FAQ</Link>
              <Link href="/h/demo-hotel" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Demo Hotel</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Log in
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Start Free Trial
              </Link>
            </div>

            {/* Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-3">
            <Link href="#features" className="block text-sm text-gray-600 dark:text-gray-400 py-2">Features</Link>
            <Link href="#pricing" className="block text-sm text-gray-600 dark:text-gray-400 py-2">Pricing</Link>
            <Link href="#faq" className="block text-sm text-gray-600 dark:text-gray-400 py-2">FAQ</Link>
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" className="btn-secondary text-center text-sm">Log in</Link>
              <Link href="/register" className="btn-primary text-center text-sm">Start Free Trial</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-20 pb-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4" />
              14-day free trial — No credit card required
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Run Your Hotel &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
                Restaurant Smarter
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              HospitPro gives you everything to manage bookings, QR menus, online orders, and payments — in one beautiful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 text-base">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/h/demo-hotel" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold px-8 py-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 transition-all text-base">
                <Hotel className="h-5 w-5" />
                View Demo Hotel
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              {[
                { label: "Businesses", value: "500+" },
                { label: "Bookings/Month", value: "10K+" },
                { label: "Uptime", value: "99.9%" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stat.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Up and running in minutes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              No technical expertise needed. Sign up, set up your property, and you're live.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 to-primary-200 dark:from-primary-800 dark:to-primary-800" />
            {[
              { step: "1", icon: Users, title: "Sign Up", desc: "Create your account and start your 14-day free trial instantly." },
              { step: "2", icon: Building, title: "Set Up Property", desc: "Add your rooms, menu items, photos, and business details." },
              { step: "3", icon: TrendingUp, title: "Go Live", desc: "Share your unique URL or QR code. Start accepting bookings!" },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Purpose-built features for hotels and restaurants — from booking management to real-time analytics.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", feature.color)}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start with a 14-day free trial. No credit card required.</p>
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                  billingCycle === "yearly"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                Yearly
                <span className="ml-2 text-xs bg-success-100 text-success-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "card p-6 relative",
                  plan.popular && "ring-2 ring-primary-500 shadow-lg shadow-primary-500/10"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ₹{billingCycle === "monthly" ? plan.price.monthly.toLocaleString() : plan.price.yearly.toLocaleString()}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-success-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={cn(
                    "block text-center w-full py-3 rounded-xl font-semibold transition-all text-sm",
                    plan.popular
                      ? "bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/20"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Loved by hospitality owners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQ key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-12 shadow-xl shadow-primary-500/20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to transform your business?</h2>
            <p className="text-primary-100 text-lg mb-8">Start your 14-day free trial today. No credit card required.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-all shadow-lg text-base">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/r/demo-restaurant" className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-primary-700 transition-all border border-primary-400 text-base">
                <UtensilsCrossed className="h-5 w-5" />
                View Demo Restaurant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-12 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">HospitPro</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">All-in-one platform for hotels and restaurants.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Product</h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "API Docs"].map((l) => (
                  <li key={l}><Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Contact"].map((l) => (
                  <li key={l}><Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Legal</h4>
              <ul className="space-y-2">
                {["Privacy", "Terms", "Refund Policy"].map((l) => (
                  <li key={l}><Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} HospitPro. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Globe className="h-4 w-4 text-gray-400" />
              <Smartphone className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

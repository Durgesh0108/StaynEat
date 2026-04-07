import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HospitPro — Hotel & Restaurant Management Platform",
    template: "%s | HospitPro",
  },
  description:
    "HospitPro is the all-in-one SaaS platform for hotels and restaurants. Manage bookings, orders, menus, and payments — all in one place.",
  keywords: ["hotel management", "restaurant management", "SaaS", "booking system", "POS"],
  authors: [{ name: "HospitPro" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "HospitPro",
    title: "HospitPro — Hotel & Restaurant Management Platform",
    description: "All-in-one SaaS platform for hospitality businesses",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-outfit antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "var(--font-outfit)",
                borderRadius: "10px",
                fontSize: "14px",
              },
              success: {
                style: {
                  background: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                },
              },
              error: {
                style: {
                  background: "#fff1f2",
                  color: "#881337",
                  border: "1px solid #fecdd3",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

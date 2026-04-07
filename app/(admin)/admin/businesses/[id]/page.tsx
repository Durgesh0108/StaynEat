export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Building2, Users, BedDouble, ShoppingBag, Star, Tag } from "lucide-react";

export default async function AdminBusinessDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true, createdAt: true } },
      settings: true,
      _count: {
        select: {
          rooms: true,
          menuItems: true,
          bookings: true,
          orders: true,
          reviews: true,
          coupons: true,
          staffMembers: true,
        },
      },
    },
  });

  if (!business) notFound();

  const [revenueBookings, revenueOrders] = await Promise.all([
    prisma.booking.aggregate({
      where: { businessId: params.id, paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { businessId: params.id, paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalRevenue = (revenueBookings._sum.totalAmount ?? 0) + (revenueOrders._sum.totalAmount ?? 0);

  const stats = [
    { label: "Rooms", value: business._count.rooms, icon: BedDouble },
    { label: "Menu Items", value: business._count.menuItems, icon: ShoppingBag },
    { label: "Bookings", value: business._count.bookings, icon: Users },
    { label: "Orders", value: business._count.orders, icon: ShoppingBag },
    { label: "Reviews", value: business._count.reviews, icon: Star },
    { label: "Coupons", value: business._count.coupons, icon: Tag },
    { label: "Staff", value: business._count.staffMembers, icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/businesses" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h1>
          <p className="text-sm text-gray-500">{business.slug} · {business.type}</p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <s.icon className="h-5 w-5 text-primary-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Business Info */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Business Details</h3>
          </div>
          {[
            { label: "Name", value: business.name },
            { label: "Type", value: business.type },
            { label: "City", value: business.city ?? "—" },
            { label: "Phone", value: business.phone ?? "—" },
            { label: "Email", value: business.email ?? "—" },
            { label: "Website", value: business.website ?? "—" },
            { label: "Created", value: format(new Date(business.createdAt), "dd MMM yyyy") },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-40">{value}</span>
            </div>
          ))}
        </div>

        {/* Owner + Subscription */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Owner</h3>
            {[
              { label: "Name", value: business.owner.name ?? "—" },
              { label: "Email", value: business.owner.email ?? "—" },
              { label: "Joined", value: format(new Date(business.owner.createdAt), "dd MMM yyyy") },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 dark:text-white font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Subscription</h3>
            {[
              { label: "Status", value: business.subscriptionStatus ?? "NONE" },
              { label: "Plan", value: business.subscriptionPlan ?? "—" },
              {
                label: "End Date",
                value: business.subscriptionEndDate
                  ? format(new Date(business.subscriptionEndDate), "dd MMM yyyy")
                  : "—",
              },
              {
                label: "Trial Ends",
                value: business.trialEndsAt
                  ? format(new Date(business.trialEndsAt), "dd MMM yyyy")
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 dark:text-white font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Revenue Generated</p>
            <p className="text-2xl font-bold text-success-600">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

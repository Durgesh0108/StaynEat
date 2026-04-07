export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CheckCircle, Clock, ChefHat, Package, Star, BedDouble } from "lucide-react";

interface Props { params: { slug: string; orderId: string } }

const STATUS_STEPS = [
  { key: "PENDING", label: "Placed", icon: CheckCircle },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
  { key: "PREPARING", label: "Preparing", icon: ChefHat },
  { key: "READY", label: "On the way", icon: Package },
  { key: "DELIVERED", label: "Delivered", icon: Star },
];

export default async function HotelOrderStatusPage({ params }: Props) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
      business: { select: { name: true, slug: true } },
    },
  });

  if (!order || order.business.slug !== params.slug) notFound();

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);

  // Fetch room info if roomId exists
  const room = order.roomId
    ? await prisma.room.findUnique({ where: { id: order.roomId }, select: { roomNumber: true, name: true } })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{order.business.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Order #{order.id.slice(-6).toUpperCase()}</p>
          {room && (
            <p className="text-sm text-primary-600 dark:text-primary-400 flex items-center justify-center gap-1 mt-1">
              <BedDouble className="h-4 w-4" />Room {room.roomNumber} · Room Service
            </p>
          )}
        </div>

        {/* Status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Order Status</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              order.status === "DELIVERED" ? "bg-success-100 text-success-700" :
              order.status === "CANCELLED" ? "bg-danger-100 text-danger-700" :
              "bg-amber-100 text-amber-700"
            }`}>{order.status}</span>
          </div>
          {order.status !== "CANCELLED" && (
            <div className="flex items-center gap-1">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIdx;
                const active = i === currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"} ${active ? "ring-2 ring-primary-300 ring-offset-2" : ""}`}>
                        <step.icon className={`h-3.5 w-3.5 ${done ? "text-white" : "text-gray-400"}`} />
                      </div>
                      <p className={`text-xs mt-1 text-center leading-tight ${active ? "text-primary-600 font-semibold" : done ? "text-gray-600 dark:text-gray-300" : "text-gray-400"}`}>
                        {step.label}
                      </p>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-shrink-0 w-4 mt-[-14px] ${i < currentStepIdx ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(order.status === "CONFIRMED" || order.status === "PREPARING") && (
          <div className="card p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Estimated Delivery</p>
              <p className="text-xs text-gray-500">15–30 minutes to your room</p>
            </div>
          </div>
        )}

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Items Ordered</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{item.quantity}× {item.menuItem.name}</span>
                <span className="text-gray-900 dark:text-white font-medium">₹{item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>₹{order.taxAmount.toFixed(0)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-sm text-success-600"><span>Discount</span><span>-₹{order.discountAmount}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 dark:text-white"><span>Total</span><span>₹{order.totalAmount.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="card p-4 flex justify-between text-sm">
          <span className="text-gray-500">Payment</span>
          <span className={`font-medium ${order.paymentStatus === "PAID" ? "text-success-600" : "text-amber-600"}`}>
            {order.paymentStatus === "PAID" ? "Paid" : "Pay on delivery"}
          </span>
        </div>

        <p className="text-xs text-center text-gray-400">
          Order placed at {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
        </p>

        {room && (
          <div className="text-center">
            <a href={`/h/${params.slug}/menu?room=${room.roomNumber}`} className="text-xs text-primary-600 hover:underline">
              Order More →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

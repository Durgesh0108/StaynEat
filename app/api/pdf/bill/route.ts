/**
 * GET /api/pdf/bill?sessionId=<id>&businessId=<id>&size=a4|80mm|57mm
 *
 * Generates a food order bill PDF:
 *   size=a4   → full A4 bill (default)
 *   size=80mm → 80mm thermal receipt
 *   size=57mm → 57mm thermal receipt
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePDF, type ThermalWidth } from "@/lib/pdf-generator";
import { buildFoodBillA4HTML, buildFoodBillThermalHTML } from "@/lib/pdf-templates/food-bill";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const businessId = searchParams.get("businessId");
  const size = (searchParams.get("size") ?? "a4").toLowerCase();

  if (!sessionId || !businessId) {
    return NextResponse.json({ error: "Missing sessionId or businessId" }, { status: 400 });
  }

  try {
    const [orders, business] = await Promise.all([
      prisma.order.findMany({
        where: { sessionId, businessId },
        include: {
          items: {
            include: { menuItem: { select: { name: true } } },
          },
          table: { select: { tableNumber: true } },
          room: { select: { roomNumber: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: {
          name: true,
          type: true,
          address: true,
          phone: true,
        },
      }),
    ]);

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (orders.length === 0) {
      return NextResponse.json({ error: "No orders found for this session" }, { status: 404 });
    }

    // Aggregate totals
    const grandSubtotal = orders.reduce((s, o) => s + o.subtotal, 0);
    const grandTax = orders.reduce((s, o) => s + o.taxAmount, 0);
    const grandDiscount = orders.reduce((s, o) => s + o.discountAmount, 0);
    const grandTotal = orders.reduce((s, o) => s + o.totalAmount, 0);

    // Derive context and location from first order
    const firstOrder = orders[0];
    const context: "restaurant" | "hotel" = business.type === "HOTEL" ? "hotel" : "restaurant";
    const tableNumber = firstOrder.table?.tableNumber;
    const roomNumber = firstOrder.room?.roomNumber;
    const paymentMethod = firstOrder.paymentMethod ?? undefined;

    const templateData = {
      sessionId,
      businessName: business.name,
      businessAddress: business.address,
      businessPhone: business.phone,
      context,
      tableNumber,
      roomNumber,
      orders: orders.map((o, idx) => ({
        id: o.id,
        index: idx + 1,
        createdAt: o.createdAt,
        status: o.status,
        items: o.items.map((item) => ({
          name: item.menuItem.name,
          qty: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        subtotal: o.subtotal,
        taxAmount: o.taxAmount,
        discountAmount: o.discountAmount,
        totalAmount: o.totalAmount,
      })),
      grandSubtotal,
      grandTax,
      grandDiscount,
      grandTotal,
      paymentMethod,
      generatedAt: new Date(),
    };

    let pdfBuffer: Buffer;
    let filename: string;
    const billRef = sessionId.slice(-8).toUpperCase();

    if (size === "80mm" || size === "57mm") {
      const thermalWidth = size as ThermalWidth;
      const html = buildFoodBillThermalHTML(templateData, thermalWidth);
      pdfBuffer = await generatePDF(html, { thermalWidth });
      filename = `receipt-${thermalWidth}-${billRef}.pdf`;
    } else {
      // Default: A4
      const html = buildFoodBillA4HTML(templateData);
      pdfBuffer = await generatePDF(html, { format: "A4" });
      filename = `bill-${billRef}.pdf`;
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[PDF/bill]", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  acceptOnlinePayment: z.boolean().optional(),
  acceptOfflinePayment: z.boolean().optional(),
  notificationEmail: z.string().email().optional().or(z.literal("")),
  whatsappNumber: z.string().optional(),
  foodModuleEnabled: z.boolean().optional(),
  onlineOrderingEnabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (business.ownerId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const {
      checkInTime, checkOutTime, taxPercentage, acceptOnlinePayment, acceptOfflinePayment,
      notificationEmail, whatsappNumber, foodModuleEnabled, onlineOrderingEnabled,
      ...businessFields
    } = parsed.data;

    const settingsFields = {
      checkInTime, checkOutTime, taxPercentage, acceptOnlinePayment, acceptOfflinePayment,
      notificationEmail, whatsappNumber, foodModuleEnabled, onlineOrderingEnabled,
    };
    const hasSettingsFields = Object.values(settingsFields).some((v) => v !== undefined);

    const [updatedBusiness] = await prisma.$transaction([
      prisma.business.update({
        where: { id: params.id },
        data: Object.fromEntries(
          Object.entries(businessFields).filter(([, v]) => v !== undefined)
        ),
        include: { settings: true },
      }),
      ...(hasSettingsFields
        ? [
            prisma.businessSettings.upsert({
              where: { businessId: params.id },
              create: {
                businessId: params.id,
                checkInTime: checkInTime ?? "14:00",
                checkOutTime: checkOutTime ?? "11:00",
                taxPercentage: taxPercentage ?? 18,
                acceptOnlinePayment: acceptOnlinePayment ?? true,
                acceptOfflinePayment: acceptOfflinePayment ?? true,
                notificationEmail: notificationEmail ?? null,
                whatsappNumber: whatsappNumber ?? null,
                foodModuleEnabled: foodModuleEnabled ?? true,
                onlineOrderingEnabled: onlineOrderingEnabled ?? true,
              },
              update: Object.fromEntries(
                Object.entries(settingsFields).filter(([, v]) => v !== undefined)
              ),
            }),
          ]
        : []),
    ]);

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Business update error:", error);
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const business = await prisma.business.findUnique({
      where: { id: params.id },
      include: { settings: true },
    });
    if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (business.ownerId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Business fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.business.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Business delete error:", error);
    return NextResponse.json({ error: "Failed to delete business" }, { status: 500 });
  }
}

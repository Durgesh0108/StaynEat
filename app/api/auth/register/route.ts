import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateSlug } from "@/utils/generateSlug";
import { addDays } from "date-fns";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  businessType: z.enum(["HOTEL", "RESTAURANT", "BOTH"]),
  city: z.string().min(2),
  phone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Generate unique slug
    let slug = generateSlug(data.businessName);
    const slugExists = await prisma.business.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const trialEndsAt = addDays(new Date(), parseInt(process.env.TRIAL_DAYS ?? "14"));

    // Create user + business atomically
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: "OWNER",
        business: {
          create: {
            name: data.businessName,
            slug,
            type: data.businessType,
            city: data.city,
            subscriptionStatus: "TRIAL",
            trialEndsAt,
            isActive: true,
            isVerified: false,
            settings: {
              create: {
                acceptOnlinePayment: true,
                acceptOfflinePayment: true,
                autoConfirmBookings: false,
                checkInTime: "14:00",
                checkOutTime: "11:00",
                currencyCode: "INR",
                taxPercentage: 18,
                foodModuleEnabled: data.businessType !== "HOTEL",
                onlineOrderingEnabled: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

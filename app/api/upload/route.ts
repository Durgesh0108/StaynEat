export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, folder } = await req.json();
    if (!data) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const result = await uploadImage(data, folder ?? "hospitpro");
    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

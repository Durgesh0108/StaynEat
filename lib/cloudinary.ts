import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(
  file: string, // base64 or URL
  folder: string = "hospitpro",
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      public_id: publicId,
      resource_type: "auto",
      transformation: [
        { quality: "auto", fetch_format: "auto" },
        { width: 1200, height: 800, crop: "limit" },
      ],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
}

export function getOptimizedUrl(
  url: string,
  options?: { width?: number; height?: number; quality?: string }
): string {
  if (!url.includes("cloudinary.com")) return url;
  const { width = 800, height, quality = "auto" } = options ?? {};
  const transformations = [`q_${quality}`, `f_auto`, `w_${width}`];
  if (height) transformations.push(`h_${height}`, "c_fill");

  return url.replace("/upload/", `/upload/${transformations.join(",")}/`);
}

export async function generateSignature(
  timestamp: number,
  folder: string
): Promise<string> {
  const crypto = await import("crypto");
  const params = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  return crypto.createHash("sha1").update(params).digest("hex");
}

export default cloudinary;

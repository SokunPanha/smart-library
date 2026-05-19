import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "library/books", resource_type: "image", transformation: [{ width: 400, crop: "limit" }] },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result as { secure_url: string; public_id: string });
        }
      )
      .end(buffer);
  });

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const publicId = searchParams.get("publicId");
  if (!publicId) return NextResponse.json({ error: "Missing publicId" }, { status: 400 });

  await cloudinary.uploader.destroy(publicId);
  return NextResponse.json({ success: true });
}

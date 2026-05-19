import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_FOLDERS = ["library/books", "library/members"] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawFolder = searchParams.get("folder") ?? "library/books";
  const folder: UploadFolder = (ALLOWED_FOLDERS as readonly string[]).includes(rawFolder)
    ? (rawFolder as UploadFolder)
    : "library/books";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const isAvatar = folder === "library/members";
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: isAvatar
            ? [{ width: 200, height: 200, crop: "fill", gravity: "face" }]
            : [{ width: 400, crop: "limit" }],
        },
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

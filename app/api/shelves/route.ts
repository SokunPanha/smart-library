import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const shelfSchema = z.object({
  code: z.string().min(1),
  cabinet: z.string().min(1),
  side: z.string().optional().nullable(),
  shelfNo: z.number().int().min(1),
  sectionNo: z.number().int().min(1),
  zone: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cabinet = searchParams.get("cabinet");

  const shelves = await prisma.shelf.findMany({
    where: cabinet ? { cabinet } : undefined,
    orderBy: [{ cabinet: "asc" }, { side: "asc" }, { shelfNo: "asc" }, { sectionNo: "asc" }],
    include: { _count: { select: { books: true } } },
  });
  return NextResponse.json(shelves);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = shelfSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const shelf = await prisma.shelf.create({ data: parsed.data });
  await logActivity(session, "SHELF_CREATED", `Added shelf: ${shelf.code}`, shelf.id);
  return NextResponse.json(shelf, { status: 201 });
}

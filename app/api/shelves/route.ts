import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const shelfSchema = z.object({
  code: z.string().min(1),
  label: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  cabinet: z.string().optional().nullable(),
  level: z.number().int().optional().nullable(),
  block: z.number().int().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cabinet = searchParams.get("cabinet");

  const shelves = await prisma.shelf.findMany({
    where: cabinet ? { cabinet } : undefined,
    orderBy: [{ cabinet: "asc" }, { level: "asc" }, { block: "asc" }, { code: "asc" }],
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
  return NextResponse.json(shelf, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const shelfSchema = z.object({
  code: z.string().min(1),
  cabinet: z.string().min(1),
  side: z.string().optional().nullable(),
  shelfNo: z.number().int().min(1),
  sectionNo: z.number().int().min(1),
  zone: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const parsed = shelfSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const shelf = await prisma.shelf.update({ where: { id }, data: parsed.data });
  return NextResponse.json(shelf);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { count } = await prisma.book.updateMany({ where: { shelfId: id }, data: { shelfId: null } });
  await prisma.shelf.delete({ where: { id } });
  return NextResponse.json({ ok: true, unlocated: count });
}

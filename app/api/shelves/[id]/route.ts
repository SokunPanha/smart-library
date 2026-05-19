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
  const count = await prisma.book.count({ where: { shelfId: id } });
  if (count > 0) return NextResponse.json({ error: `Shelf has ${count} books. Reassign them first.` }, { status: 409 });
  await prisma.shelf.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

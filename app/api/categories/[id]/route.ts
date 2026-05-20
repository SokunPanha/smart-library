import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const existing = await prisma.category.findFirst({ where: { name: name.trim(), NOT: { id } } });
  if (existing) return NextResponse.json({ error: "Category name already in use." }, { status: 409 });

  const old = await prisma.category.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const [category] = await prisma.$transaction([
    prisma.category.update({ where: { id }, data: { name: name.trim() } }),
    prisma.book.updateMany({ where: { category: old.name }, data: { category: name.trim() } }),
  ]);

  await logActivity(session, "CATEGORY_UPDATED", `Renamed category: "${old.name}" → "${name.trim()}"`, id);
  return NextResponse.json(category);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const inUse = await prisma.book.count({ where: { category: category.name } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${inUse} book(s) use this category.` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });
  await logActivity(session, "CATEGORY_DELETED", `Deleted category: ${category.name}`, id);
  return NextResponse.json({ ok: true });
}

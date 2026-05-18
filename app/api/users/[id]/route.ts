import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function PUT(req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { nameEn, nameKh, role, password } = await req.json();
  const data: Record<string, string> = { nameEn, role };
  if (nameKh) data.nameKh = nameKh;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, nameEn: true, nameKh: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const count = await prisma.user.count();
  if (count <= 1) return NextResponse.json({ error: "Cannot delete the last user." }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

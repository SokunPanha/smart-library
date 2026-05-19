import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLog";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  if ((session.user as { role?: string }).role !== "ADMIN")
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  return { error: null, session };
}

export async function PUT(req: Request, { params }: Params) {
  const { error, session } = await requireAdmin();
  if (error) return error;

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

  await logActivity(session!, "USER_UPDATED", `Updated user: ${user.email} (${user.role})`, user.id);
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const count = await prisma.user.count();
  if (count <= 1) return NextResponse.json({ error: "Cannot delete the last user." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
  await prisma.user.delete({ where: { id } });
  await logActivity(session!, "USER_DELETED", `Deleted user: ${user?.email} (${user?.role})`, id);
  return NextResponse.json({ ok: true });
}

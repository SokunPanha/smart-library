import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLog";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { nameEn, nameKh, role: newRole, password } = await req.json();
  const data: Record<string, string> = { nameEn, role: newRole };
  if (nameKh) data.nameKh = nameKh;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, nameEn: true, nameKh: true, role: true, createdAt: true },
  });

  await logActivity(session, "USER_UPDATED", `Updated user: ${user.email} (${user.role})`, user.id);
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const count = await prisma.user.count();
  if (count <= 1) return NextResponse.json({ error: "Cannot delete the last user." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
  await prisma.user.delete({ where: { id } });
  await logActivity(session, "USER_DELETED", `Deleted user: ${user?.email} (${user?.role})`, id);
  return new NextResponse(null, { status: 204 });
}

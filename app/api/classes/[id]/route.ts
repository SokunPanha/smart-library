import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { logActivity } from "@/lib/activityLog";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { id } = await params;
  const cls = await prisma.class.findUnique({ where: { id }, include: { _count: { select: { members: true } } } });
  if (!cls) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (cls._count.members > 0) {
    return NextResponse.json({ error: `Cannot delete — ${cls._count.members} member(s) are in this class.` }, { status: 400 });
  }

  await prisma.class.delete({ where: { id } });
  await logActivity(session, "CLASS_DELETED", `Deleted class: ${cls.name}`, id);
  return NextResponse.json({ ok: true });
}

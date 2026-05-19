import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const memberSchema = z.object({
  nameKh: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  type: z.enum(["STUDENT", "TEACHER", "PUBLIC", "RESEARCHER"]).default("PUBLIC"),
  expiresAt: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      loans: {
        include: { book: true },
        orderBy: { borrowedAt: "desc" },
      },
    },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(member);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const { expiresAt, email, classId, ...rest } = parsed.data;
  const member = await prisma.member.update({
    where: { id },
    data: {
      ...rest,
      email: email || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      classId: classId || null,
      updatedBy: actor,
    },
  });

  await logActivity(session, "MEMBER_UPDATED", `Updated member: ${member.nameKh ?? member.nameEn ?? member.memberId} (${member.memberId})`, member.id);
  return NextResponse.json(member);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const activeLoans = await prisma.loan.count({
    where: { memberId: id, status: "ACTIVE" },
  });
  if (activeLoans > 0) {
    return NextResponse.json(
      { error: "Cannot delete a member with active loans." },
      { status: 409 }
    );
  }

  const member = await prisma.member.findUnique({ where: { id }, select: { nameEn: true, nameKh: true, memberId: true } });
  await prisma.member.delete({ where: { id } });
  await logActivity(session, "MEMBER_DELETED", `Deleted member: ${member?.nameKh ?? member?.nameEn ?? member?.memberId} (${member?.memberId})`, id);
  return new NextResponse(null, { status: 204 });
}

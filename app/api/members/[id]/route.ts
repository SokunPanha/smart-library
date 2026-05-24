import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";
import { requireAdminApi } from "@/lib/portalAuth";

const memberSchema = z.object({
  nameKh: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  photo: z.string().url().optional().nullable(),
  type: z.enum(["STUDENT", "TEACHER", "PUBLIC", "RESEARCHER"]).default("PUBLIC"),
  expiresAt: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;

  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      id: true, memberId: true, nameKh: true, nameEn: true, email: true,
      phone: true, photo: true, type: true, expiresAt: true,
      createdAt: true, updatedAt: true, createdBy: true, updatedBy: true,
      portalApproved: true, classId: true,
      class: { select: { name: true } },
      loans: {
        select: {
          id: true, status: true, borrowedAt: true, dueAt: true, returnedAt: true,
          fineAmount: true, finePaid: true, renewalCount: true,
          book: { select: { id: true, titleKh: true, titleEn: true, author: true } },
        },
        orderBy: { borrowedAt: "desc" },
        take: 100,
      },
      reservations: {
        select: {
          id: true, status: true, reservedAt: true, fulfilledAt: true,
          book: { select: { id: true, titleKh: true, titleEn: true } },
        },
        orderBy: { reservedAt: "desc" },
      },
      visitorLogs: {
        select: {
          id: true, purpose: true, arrivedAt: true, leftAt: true, note: true,
          books: { include: { book: { select: { id: true, titleKh: true, titleEn: true } } } },
        },
        orderBy: { arrivedAt: "desc" },
        take: 100,
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
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { id } = await params;
  const body = await req.json();
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const { expiresAt, email, classId, photo, ...rest } = parsed.data;
  const member = await prisma.member.update({
    where: { id },
    data: {
      ...rest,
      email: email || null,
      photo: photo ?? undefined,
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
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { id } = await params;
  const activeLoans = await prisma.loan.count({
    where: { memberId: id, status: "ACTIVE" },
  });
  if (activeLoans > 0) {
    return NextResponse.json(
      { error: "ACTIVE_LOANS" },
      { status: 409 }
    );
  }

  const member = await prisma.member.findUnique({ where: { id }, select: { nameEn: true, nameKh: true, memberId: true } });
  await prisma.member.delete({ where: { id } });
  await logActivity(session, "MEMBER_DELETED", `Deleted member: ${member?.nameKh ?? member?.nameEn ?? member?.memberId} (${member?.memberId})`, id);
  return new NextResponse(null, { status: 204 });
}

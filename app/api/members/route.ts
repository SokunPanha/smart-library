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

const MEMBER_SELECT = {
  id: true,
  memberId: true,
  nameKh: true,
  nameEn: true,
  email: true,
  phone: true,
  photo: true,
  type: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  portalApproved: true,
  classId: true,
  _count: { select: { loans: true } },
  class: { select: { id: true, name: true } },
} as const;

async function generateMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.member.count();
  const candidate = `MEM-${year}-${String(count + 1).padStart(4, "0")}`;
  const exists = await prisma.member.findUnique({ where: { memberId: candidate } });
  if (!exists) return candidate;
  return `MEM-${year}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const portalApprovedParam = searchParams.get("portalApproved");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { nameEn: { contains: search, mode: "insensitive" as const } },
      { nameKh: { contains: search, mode: "insensitive" as const } },
      { memberId: { contains: search, mode: "insensitive" as const } },
      { phone: { contains: search, mode: "insensitive" as const } },
    ];
  }
  if (portalApprovedParam !== null) {
    where.portalApproved = portalApprovedParam === "true";
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: MEMBER_SELECT,
    }),
    prisma.member.count({ where }),
  ]);

  // Augment with hasPassword without exposing the hash
  const membersWithFlag = members.map((m) => ({
    ...m,
    hasPassword: !!(m as unknown as { portalPassword?: string | null }).portalPassword,
  }));

  return NextResponse.json({ members: membersWithFlag, total, page, limit });
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const body = await req.json();
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const { expiresAt, email, classId, photo, ...rest } = parsed.data;
  const memberId = await generateMemberId();

  try {
    const member = await prisma.member.create({
      data: {
        ...rest,
        memberId,
        email: email || null,
        photo: photo || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        classId: classId || null,
        createdBy: actor,
        updatedBy: actor,
      },
      select: MEMBER_SELECT,
    });

    await logActivity(session, "MEMBER_CREATED", `Added member: ${member.nameKh ?? member.nameEn ?? memberId} (${memberId})`, member.id);
    return NextResponse.json(member, { status: 201 });
  } catch (err: unknown) {
    // P2002 = unique constraint violation (race on memberId)
    if ((err as { code?: string }).code === "P2002") {
      const fallbackId = `MEM-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
      const member = await prisma.member.create({
        data: {
          ...rest,
          memberId: fallbackId,
          email: email || null,
          photo: photo || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          classId: classId || null,
          createdBy: actor,
          updatedBy: actor,
        },
        select: MEMBER_SELECT,
      });
      await logActivity(session, "MEMBER_CREATED", `Added member: ${member.nameKh ?? member.nameEn ?? fallbackId} (${fallbackId})`, member.id);
      return NextResponse.json(member, { status: 201 });
    }
    throw err;
  }
}

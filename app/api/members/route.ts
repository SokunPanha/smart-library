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
});

async function generateMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.member.count();
  const candidate = `MEM-${year}-${String(count + 1).padStart(4, "0")}`;
  const exists = await prisma.member.findUnique({ where: { memberId: candidate } });
  if (!exists) return candidate;
  return `MEM-${year}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));

  const where = search
    ? {
        OR: [
          { nameEn: { contains: search, mode: "insensitive" as const } },
          { nameKh: { contains: search, mode: "insensitive" as const } },
          { memberId: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { loans: true } } },
    }),
    prisma.member.count({ where }),
  ]);

  return NextResponse.json({ members, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const { expiresAt, email, ...rest } = parsed.data;
  const memberId = await generateMemberId();
  const member = await prisma.member.create({
    data: {
      ...rest,
      memberId,
      email: email || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: actor,
      updatedBy: actor,
    },
  });

  await logActivity(session, "MEMBER_CREATED", `Added member: ${member.nameKh ?? member.nameEn ?? memberId} (${memberId})`, member.id);
  return NextResponse.json(member, { status: 201 });
}

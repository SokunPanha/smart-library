import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";
import { z } from "zod";

const createSchema = z.object({
  memberId: z.string().min(1),
  purpose: z.enum(["READING", "BORROWING", "SCHOOLWORK", "RESEARCH", "OTHER"]),
  bookId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
  const search = searchParams.get("search") ?? "";
  const purpose = searchParams.get("purpose") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const todayOnly = searchParams.get("todayOnly") === "true";
  const openOnly = searchParams.get("openOnly") === "true";

  const where: Record<string, unknown> = {};

  if (openOnly) where.leftAt = null;

  if (todayOnly) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.arrivedAt = { gte: start, lte: end };
  } else if (dateFrom || dateTo) {
    where.arrivedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
    };
  }

  if (purpose) where.purpose = purpose;

  if (search) {
    where.member = {
      OR: [
        { nameKh: { contains: search, mode: "insensitive" } },
        { nameEn: { contains: search, mode: "insensitive" } },
        { memberId: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [logs, total] = await Promise.all([
    prisma.visitorLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { arrivedAt: "desc" },
      include: {
        member: { select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, class: { select: { name: true } } } },
        book: { select: { id: true, titleKh: true, titleEn: true } },
      },
    }),
    prisma.visitorLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const { memberId, purpose, bookId, note } = parsed.data;

  // Check member exists
  const member = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true, nameKh: true, nameEn: true, memberId: true } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const log = await prisma.visitorLog.create({
    data: { memberId, purpose, bookId: bookId || null, note: note || null, recordedBy: actor },
    include: {
      member: { select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, class: { select: { name: true } } } },
      book: { select: { id: true, titleKh: true, titleEn: true } },
    },
  });

  await logActivity(session, "VISITOR_CHECKIN", `${member.nameKh ?? member.nameEn} (${member.memberId}) checked in — ${purpose}`);
  return NextResponse.json(log, { status: 201 });
}

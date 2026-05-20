import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [readerGroups, loanGroups] = await Promise.all([
    prisma.visitorLog.groupBy({
      by: ["memberId"],
      where: { arrivedAt: { gte: startOfMonth } },
      _count: { memberId: true },
      orderBy: { _count: { memberId: "desc" } },
      take: 10,
    }),
    prisma.loan.groupBy({
      by: ["bookId"],
      where: { borrowedAt: { gte: startOfMonth } },
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 10,
    }),
  ]);

  const [members, books] = await Promise.all([
    prisma.member.findMany({
      where: { id: { in: readerGroups.map((r) => r.memberId) } },
      select: { id: true, nameKh: true, nameEn: true, photo: true, class: { select: { name: true } } },
    }),
    prisma.book.findMany({
      where: { id: { in: loanGroups.map((b) => b.bookId) } },
      select: { id: true, titleKh: true, titleEn: true, coverImage: true, author: true },
    }),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const topReaders = readerGroups
    .map((g, i) => ({ rank: i + 1, ...memberMap.get(g.memberId), visitCount: g._count.memberId }))
    .filter((r) => r.id);

  const topBooks = loanGroups
    .map((g, i) => ({ rank: i + 1, ...bookMap.get(g.bookId), borrowCount: g._count.bookId }))
    .filter((b) => b.id);

  return NextResponse.json({ topReaders, topBooks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { qrValue, purpose, dryRun } = await req.json();
  if (!qrValue) return NextResponse.json({ error: "qrValue required" }, { status: 422 });

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "Kiosk";

  // Find member by exact memberId match (QR code contains memberId)
  const member = await prisma.member.findFirst({
    where: {
      OR: [
        { memberId: { equals: qrValue.trim(), mode: "insensitive" } },
        { nameKh: { equals: qrValue.trim() } },
      ],
    },
    select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, photo: true, class: { select: { name: true } } },
  });
  if (!member) return NextResponse.json({ error: "MEMBER_NOT_FOUND" }, { status: 404 });

  // Check for an open visit (checked in, not yet checked out)
  const openVisit = await prisma.visitorLog.findFirst({
    where: { memberId: member.id, leftAt: null },
    orderBy: { arrivedAt: "desc" },
  });

  if (dryRun) {
    return NextResponse.json({ action: openVisit ? "checkout" : "checkin", member });
  }

  if (openVisit) {
    // Auto checkout
    const now = new Date();
    const durationMs = now.getTime() - openVisit.arrivedAt.getTime();
    const durationMin = Math.round(durationMs / 60000);

    await prisma.visitorLog.update({
      where: { id: openVisit.id },
      data: { leftAt: now },
    });

    await logActivity(session, "VISITOR_CHECKOUT",
      `${member.nameKh ?? member.nameEn} (${member.memberId}) checked out via kiosk`);

    return NextResponse.json({ action: "checkout", member, durationMin });
  }

  // Check-in: purpose must be provided by the kiosk UI
  const checkinPurpose = purpose ?? "SCHOOLWORK";
  const log = await prisma.visitorLog.create({
    data: { memberId: member.id, purpose: checkinPurpose, recordedBy: actor },
  });

  await logActivity(session, "VISITOR_CHECKIN",
    `${member.nameKh ?? member.nameEn} (${member.memberId}) checked in via kiosk`);

  return NextResponse.json({ action: "checkin", member, logId: log.id });
}

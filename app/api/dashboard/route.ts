import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const dateFilter = dateFrom && dateTo
    ? { gte: new Date(dateFrom), lte: new Date(dateTo) }
    : undefined;

  // Mark overdue loans first
  await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const todayStart = dayjs().startOf("day").toDate();
  const todayEnd = dayjs().endOf("day").toDate();
  const dueSoonEnd = dayjs().add(7, "day").endOf("day").toDate();

  const [
    totalBooks,
    totalMembers,
    activeLoans,
    overdueLoans,
    visitorsInside,
    visitorsTodayTotal,
    recentLoans,
    dueSoon,
    recentMembers,
    loanGroups,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.member.count(),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "OVERDUE" } }),
    prisma.visitorLog.count({ where: { leftAt: null } }),
    prisma.visitorLog.count({ where: { arrivedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.loan.findMany({
      take: 10,
      where: dateFilter ? { borrowedAt: dateFilter } : undefined,
      orderBy: { borrowedAt: "desc" },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true } },
      },
    }),
    prisma.loan.findMany({
      where: {
        status: { in: ["ACTIVE", "OVERDUE"] },
        dueAt: { gte: new Date(), lte: dueSoonEnd },
      },
      take: 8,
      orderBy: { dueAt: "asc" },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true } },
      },
    }),
    prisma.member.findMany({
      take: 5,
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      orderBy: { createdAt: "desc" },
      select: { id: true, memberId: true, nameEn: true, nameKh: true, type: true, photo: true, createdAt: true },
    }),
    prisma.loan.groupBy({
      by: ["bookId"],
      where: dateFilter ? { borrowedAt: dateFilter } : undefined,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Fetch book details for popular books
  const bookIds = loanGroups.map((g) => g.bookId);
  const popularBooksRaw = bookIds.length
    ? await prisma.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, titleEn: true, titleKh: true },
      })
    : [];

  const popularBooks = loanGroups.map((g) => ({
    ...popularBooksRaw.find((b) => b.id === g.bookId),
    loanCount: g._count.id,
  }));

  return NextResponse.json({
    totalBooks,
    totalMembers,
    activeLoans,
    overdueLoans,
    visitorsInside,
    visitorsTodayTotal,
    recentLoans,
    dueSoon,
    recentMembers,
    popularBooks,
  });
}

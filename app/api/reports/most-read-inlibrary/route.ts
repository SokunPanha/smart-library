import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 10));
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const logWhere: Record<string, unknown> = { purpose: "READING" };
  if (dateFrom || dateTo) {
    logWhere.arrivedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const grouped = await prisma.visitorLogBook.groupBy({
    by: ["bookId"],
    where: { visitorLog: logWhere },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return NextResponse.json([]);

  const bookIds = grouped.map((g) => g.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, titleKh: true, titleEn: true, author: true, category: true },
  });
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const result = grouped.map((g, i) => ({
    rank: i + 1,
    book: bookMap.get(g.bookId),
    readCount: g._count.id,
  }));

  return NextResponse.json(result);
}

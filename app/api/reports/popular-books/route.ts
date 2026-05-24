import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";

export async function GET(req: Request) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 10);

  const results = await prisma.loan.groupBy({
    by: ["bookId"],
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: limit,
  });

  const bookIds = results.map((r) => r.bookId);
  const books = await prisma.book.findMany({ where: { id: { in: bookIds } } });
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b]));

  const data = results.map((r) => ({
    book: bookMap[r.bookId],
    totalLoans: r._count.bookId,
  }));

  return NextResponse.json(data);
}

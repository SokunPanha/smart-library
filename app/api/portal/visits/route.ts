import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; userType?: string } | undefined;
  if (!session || user?.userType !== "MEMBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.visitorLog.findMany({
    where: { memberId: user.id },
    orderBy: { arrivedAt: "desc" },
    select: {
      id: true,
      purpose: true,
      arrivedAt: true,
      leftAt: true,
      books: {
        select: { book: { select: { id: true, titleKh: true, titleEn: true } } },
      },
    },
  });

  // Build yearly/monthly breakdown
  const byYear: Record<string, { count: number; byMonth: Record<string, number> }> = {};
  for (const log of logs) {
    const date = new Date(log.arrivedAt);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    if (!byYear[year]) byYear[year] = { count: 0, byMonth: {} };
    byYear[year].count++;
    byYear[year].byMonth[month] = (byYear[year].byMonth[month] ?? 0) + 1;
  }

  const thisYear = String(new Date().getFullYear());

  return NextResponse.json({
    total: logs.length,
    thisYear: byYear[thisYear]?.count ?? 0,
    byYear,
    logs,
  });
}

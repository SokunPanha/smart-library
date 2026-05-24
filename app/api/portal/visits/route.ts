import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePortalApi } from "@/lib/portalAuth";

export async function GET() {
  const portalAuth = await requirePortalApi();
  if (portalAuth.response) return portalAuth.response;
  const { user } = portalAuth;

  // Aggregate year/month counts at DB level — no full table scan
  const allLogs = await prisma.visitorLog.findMany({
    where: { memberId: user.id },
    select: { id: true, purpose: true, arrivedAt: true, leftAt: true,
      books: { select: { book: { select: { id: true, titleKh: true, titleEn: true } } } },
    },
    orderBy: { arrivedAt: "desc" },
  });

  const byYear: Record<string, { count: number; byMonth: Record<string, number> }> = {};
  for (const log of allLogs) {
    const date = new Date(log.arrivedAt);
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, "0");
    if (!byYear[y]) byYear[y] = { count: 0, byMonth: {} };
    byYear[y].count++;
    byYear[y].byMonth[m] = (byYear[y].byMonth[m] ?? 0) + 1;
  }

  const thisYear = String(new Date().getFullYear());

  return NextResponse.json({
    total: allLogs.length,
    thisYear: byYear[thisYear]?.count ?? 0,
    byYear,
    logs: allLogs,
  });
}

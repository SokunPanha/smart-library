import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Default to today when no range supplied
  const rangeStart = dateFrom ? new Date(dateFrom) : dayjs().startOf("day").toDate();
  const rangeEnd = dateTo ? new Date(dateTo) : dayjs().endOf("day").toDate();

  const rangeFilter = { gte: rangeStart, lte: rangeEnd };

  const [insideNow, periodTotal, purposeGroups] = await Promise.all([
    prisma.visitorLog.count({ where: { leftAt: null } }),
    prisma.visitorLog.count({ where: { arrivedAt: rangeFilter } }),
    prisma.visitorLog.groupBy({
      by: ["purpose"],
      where: { arrivedAt: rangeFilter },
      _count: { id: true },
    }),
  ]);

  const purposeBreakdown: Record<string, number> = {};
  for (const g of purposeGroups) {
    purposeBreakdown[g.purpose] = g._count.id;
  }

  return NextResponse.json({ insideNow, periodTotal, purposeBreakdown });
}

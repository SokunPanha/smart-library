import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import dayjs from "dayjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = dayjs().startOf("day").toDate();
  const todayEnd = dayjs().endOf("day").toDate();

  const [insideNow, todayTotal, purposeGroups] = await Promise.all([
    prisma.visitorLog.count({ where: { leftAt: null } }),
    prisma.visitorLog.count({ where: { arrivedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.visitorLog.groupBy({
      by: ["purpose"],
      where: { arrivedAt: { gte: todayStart, lte: todayEnd } },
      _count: { id: true },
    }),
  ]);

  const purposeBreakdown: Record<string, number> = {};
  for (const g of purposeGroups) {
    purposeBreakdown[g.purpose] = g._count.id;
  }

  return NextResponse.json({ insideNow, todayTotal, purposeBreakdown });
}

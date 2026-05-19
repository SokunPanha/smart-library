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

  const dateFilter: Record<string, unknown> =
    dateFrom || dateTo
      ? {
          arrivedAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {};

  const grouped = await prisma.visitorLog.groupBy({
    by: ["memberId"],
    where: dateFilter,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return NextResponse.json([]);

  const memberIds = grouped.map((g) => g.memberId);

  const [members, durations] = await Promise.all([
    prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        memberId: true,
        nameKh: true,
        nameEn: true,
        type: true,
        class: { select: { name: true } },
      },
    }),
    prisma.visitorLog.findMany({
      where: { memberId: { in: memberIds }, leftAt: { not: null }, ...dateFilter },
      select: { memberId: true, arrivedAt: true, leftAt: true },
    }),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const durationMap = new Map<string, number[]>();
  durations.forEach((d) => {
    const mins = Math.round(
      (new Date(d.leftAt!).getTime() - new Date(d.arrivedAt).getTime()) / 60000
    );
    if (!durationMap.has(d.memberId)) durationMap.set(d.memberId, []);
    durationMap.get(d.memberId)!.push(mins);
  });

  const result = grouped.map((g, i) => {
    const member = memberMap.get(g.memberId);
    const mins = durationMap.get(g.memberId) ?? [];
    const avgMins =
      mins.length > 0 ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null;
    return { rank: i + 1, member, visits: g._count.id, avgMinutes: avgMins };
  });

  return NextResponse.json(result);
}

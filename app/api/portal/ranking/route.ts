import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePortalApi } from "@/lib/portalAuth";

export async function GET(req: NextRequest) {
  const portalAuth = await requirePortalApi();
  if (portalAuth.response) return portalAuth.response;
  const { user } = portalAuth;

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // "YYYY-MM"

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  // Fetch all logs for the month — need arrivedAt + leftAt to compute duration
  const logs = await prisma.visitorLog.findMany({
    where: { arrivedAt: { gte: monthStart, lt: monthEnd } },
    select: { memberId: true, arrivedAt: true, leftAt: true },
  });

  if (logs.length === 0) {
    return NextResponse.json({
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      myRank: null,
      myVisits: 0,
      myMinutes: 0,
      myDuration: "0m",
      totalParticipants: 0,
      top: [],
    });
  }

  // Aggregate per member: visit count + total minutes spent
  const statsMap = new Map<string, { visits: number; minutes: number }>();
  for (const log of logs) {
    const left = log.leftAt ?? now; // treat still-inside as leaving now
    const minutes = Math.max(0, (left.getTime() - log.arrivedAt.getTime()) / 60_000);
    const prev = statsMap.get(log.memberId) ?? { visits: 0, minutes: 0 };
    statsMap.set(log.memberId, {
      visits: prev.visits + 1,
      minutes: prev.minutes + minutes,
    });
  }

  // Sort: primary = total minutes, secondary = visit count
  const sorted = [...statsMap.entries()].sort(
    ([, a], [, b]) => b.minutes - a.minutes || b.visits - a.visits
  );

  // Fetch member details for top 10
  const topEntries = sorted.slice(0, 10);
  const topIds = topEntries.map(([id]) => id);
  const members = await prisma.member.findMany({
    where: { id: { in: topIds } },
    select: { id: true, nameKh: true, nameEn: true, photo: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Caller's position
  const myIndex = sorted.findIndex(([id]) => id === user.id);
  const myStats = myIndex >= 0 ? sorted[myIndex][1] : { visits: 0, minutes: 0 };
  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  const top = topEntries.map(([memberId, stats], i) => {
    const m = memberMap.get(memberId);
    return {
      rank: i + 1,
      memberId,
      name: m?.nameKh ?? m?.nameEn ?? "—",
      photo: m?.photo ?? null,
      visits: stats.visits,
      isMe: memberId === user.id,
    };
  });

  // Append caller if outside top 10
  if (myRank !== null && myRank > 10) {
    const myMember = await prisma.member.findUnique({
      where: { id: user.id },
      select: { nameKh: true, nameEn: true, photo: true },
    });
    top.push({
      rank: myRank,
      memberId: user.id!,
      name: myMember?.nameKh ?? myMember?.nameEn ?? "—",
      photo: myMember?.photo ?? null,
      visits: myStats.visits,
      isMe: true,
    });
  }

  return NextResponse.json({
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    myRank,
    myVisits: myStats.visits,
    totalParticipants: sorted.length,
    top,
  });
}

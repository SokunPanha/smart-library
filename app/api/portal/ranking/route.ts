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

  // Count visits per member using DB groupBy — no full table scan
  const visitGroups = await prisma.visitorLog.groupBy({
    by: ["memberId"],
    where: { arrivedAt: { gte: monthStart, lt: monthEnd } },
    _count: { memberId: true },
    orderBy: { _count: { memberId: "desc" } },
  });

  if (visitGroups.length === 0) {
    return NextResponse.json({
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      myRank: null,
      myVisits: 0,
      totalParticipants: 0,
      top: [],
    });
  }

  // Sort by visit count (groupBy already ordered, but be explicit)
  const sorted = visitGroups.map((g) => ({ memberId: g.memberId, visits: g._count.memberId }));

  // Caller's position
  const myIndex = sorted.findIndex((g) => g.memberId === user.id);
  const myVisits = myIndex >= 0 ? sorted[myIndex].visits : 0;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  // Fetch member details for top 10
  const top10 = sorted.slice(0, 10);
  const topIds = top10.map((g) => g.memberId);
  const members = await prisma.member.findMany({
    where: { id: { in: topIds } },
    select: { id: true, nameKh: true, nameEn: true, photo: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const top = top10.map((g, i) => {
    const m = memberMap.get(g.memberId);
    return {
      rank: i + 1,
      memberId: g.memberId,
      name: m?.nameKh ?? m?.nameEn ?? "—",
      photo: m?.photo ?? null,
      visits: g.visits,
      isMe: g.memberId === user.id,
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
      memberId: user.id,
      name: myMember?.nameKh ?? myMember?.nameEn ?? "—",
      photo: myMember?.photo ?? null,
      visits: myVisits,
      isMe: true,
    });
  }

  return NextResponse.json({
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    myRank,
    myVisits,
    totalParticipants: sorted.length,
    top,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    where.arrivedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const logs = await prisma.visitorLog.findMany({
    where,
    select: {
      member: { select: { class: { select: { name: true, grade: true } } } },
    },
  });

  const map = new Map<string, { className: string; grade: string | null; visits: number }>();
  logs.forEach(({ member }) => {
    const cls = member?.class;
    const key = cls?.name ?? "No Class";
    if (!map.has(key)) {
      map.set(key, { className: key, grade: cls?.grade ?? null, visits: 0 });
    }
    map.get(key)!.visits++;
  });

  const result = [...map.values()]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 30);

  return NextResponse.json(result);
}

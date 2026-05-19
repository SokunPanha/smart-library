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
    select: { arrivedAt: true },
  });

  // Count by hour 0-23
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, visits: 0 }));
  logs.forEach(({ arrivedAt }) => {
    const h = new Date(arrivedAt).getHours();
    hours[h].visits++;
  });

  return NextResponse.json(hours);
}

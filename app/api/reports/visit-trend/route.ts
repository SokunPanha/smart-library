import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupBy = searchParams.get("groupBy") ?? "day"; // day | month
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
    orderBy: { arrivedAt: "asc" },
  });

  // Group by day or month in JS
  const map = new Map<string, number>();
  logs.forEach(({ arrivedAt }) => {
    const d = new Date(arrivedAt);
    const key =
      groupBy === "month"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  const result = [...map.entries()].map(([date, visits]) => ({ date, visits }));
  return NextResponse.json(result);
}

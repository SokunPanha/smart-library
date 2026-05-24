import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";

export async function GET(req: Request) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;
  const { searchParams } = new URL(req.url);
  const months = Number(searchParams.get("months") ?? 6);

  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const loans = await prisma.loan.findMany({
    where: { borrowedAt: { gte: since } },
    select: { borrowedAt: true, returnedAt: true, status: true },
  });

  const buckets: Record<string, { month: string; checkouts: number; returns: number; overdue: number }> = {};

  for (const loan of loans) {
    const key = loan.borrowedAt.toISOString().slice(0, 7); // YYYY-MM
    if (!buckets[key]) buckets[key] = { month: key, checkouts: 0, returns: 0, overdue: 0 };
    buckets[key].checkouts++;
    if (loan.returnedAt) buckets[key].returns++;
    if (loan.status === "OVERDUE" || loan.status === "LOST") buckets[key].overdue++;
  }

  const data = Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month));
  return NextResponse.json(data);
}

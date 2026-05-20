import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Default paid-fine range to current month when none supplied
  const paidFrom = dateFrom ? new Date(dateFrom) : dayjs().startOf("month").toDate();
  const paidTo = dateTo ? new Date(dateTo) : dayjs().endOf("month").toDate();

  // Mark overdue loans before counting
  await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const [active, overdue, lost, unpaidAgg, paidAgg] = await Promise.all([
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "OVERDUE" } }),
    prisma.loan.count({ where: { status: "LOST" } }),
    prisma.loan.aggregate({
      where: { finePaid: false, fineAmount: { gt: 0 } },
      _sum: { fineAmount: true },
      _count: { id: true },
    }),
    prisma.loan.aggregate({
      where: {
        finePaid: true,
        fineAmount: { gt: 0 },
        OR: [
          { finePaidAt: { gte: paidFrom, lte: paidTo } },
          // legacy rows paid before finePaidAt field was added
          { finePaidAt: null, updatedAt: { gte: paidFrom, lte: paidTo } },
        ],
      },
      _sum: { fineAmount: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    active,
    overdue,
    lost,
    unpaidFinesCount: unpaidAgg._count.id,
    unpaidFinesTotal: unpaidAgg._sum.fineAmount ?? 0,
    paidFinesCount: paidAgg._count.id,
    paidFinesTotal: paidAgg._sum.fineAmount ?? 0,
  });
}

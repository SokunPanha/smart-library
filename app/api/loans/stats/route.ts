import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mark overdue loans before counting
  await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const [active, overdue, lost, fineAgg] = await Promise.all([
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "OVERDUE" } }),
    prisma.loan.count({ where: { status: "LOST", finePaid: false, fineAmount: { gt: 0 } } }),
    prisma.loan.aggregate({
      where: { finePaid: false, fineAmount: { gt: 0 } },
      _sum: { fineAmount: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    active,
    overdue,
    lost,
    unpaidFinesCount: fineAgg._count.id,
    unpaidFinesTotal: fineAgg._sum.fineAmount ?? 0,
  });
}

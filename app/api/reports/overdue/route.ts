import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const loans = await prisma.loan.findMany({
    where: { status: { in: ["ACTIVE", "OVERDUE"] }, dueAt: { lt: new Date() } },
    include: {
      book: { select: { titleEn: true, titleKh: true } },
      member: { select: { nameEn: true, nameKh: true, memberId: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  const now = Date.now();
  const data = loans.map((l) => ({
    ...l,
    daysOverdue: Math.floor((now - l.dueAt.getTime()) / 86_400_000),
    estimatedFine: Math.floor((now - l.dueAt.getTime()) / 86_400_000) * 500,
  }));

  return NextResponse.json(data);
}

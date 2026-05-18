import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mark overdue loans first
  await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const [totalBooks, totalMembers, activeLoans, overdueLoans, recentLoans] =
    await Promise.all([
      prisma.book.count(),
      prisma.member.count(),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "OVERDUE" } }),
      prisma.loan.findMany({
        take: 10,
        orderBy: { borrowedAt: "desc" },
        include: {
          book: { select: { titleEn: true, titleKh: true } },
          member: { select: { nameEn: true, nameKh: true, memberId: true } },
        },
      }),
    ]);

  return NextResponse.json({
    totalBooks,
    totalMembers,
    activeLoans,
    overdueLoans,
    recentLoans,
  });
}

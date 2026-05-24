import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!session || user?.userType !== "MEMBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = user.id as string;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { memberId };
  if (status) {
    where.status = status;
  }

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { borrowedAt: "desc" },
    include: {
      book: {
        select: {
          id: true,
          titleEn: true,
          titleKh: true,
          author: true,
          coverImage: true,
        },
      },
    },
  });

  return NextResponse.json({ loans });
}

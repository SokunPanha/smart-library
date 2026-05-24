import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePortalApi } from "@/lib/portalAuth";

const VALID_STATUSES = new Set(["ACTIVE", "RETURNED", "OVERDUE", "LOST"]);

export async function GET(req: NextRequest) {
  const portalAuth = await requirePortalApi();
  if (portalAuth.response) return portalAuth.response;
  const { user } = portalAuth;

  const memberId = user.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (status && !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

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

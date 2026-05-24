import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
  const search = searchParams.get("search") ?? "";

  const where = search
    ? {
        OR: [
          { userEmail: { contains: search, mode: "insensitive" as const } },
          { userName: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { action: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}

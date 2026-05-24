import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const availableOnly = searchParams.get("available") === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 24));

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { titleEn: { contains: search, mode: "insensitive" } },
      { titleKh: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { isbn: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (availableOnly) {
    where.availableCopies = { gt: 0 };
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titleEn: true,
        titleKh: true,
        author: true,
        category: true,
        coverImage: true,
        availableCopies: true,
        totalCopies: true,
        isbn: true,
        publishYear: true,
      },
    }),
    prisma.book.count({ where }),
  ]);

  return NextResponse.json({ books, total, page, limit });
}

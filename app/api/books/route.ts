import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const bookSchema = z.object({
  isbn: z.string().optional().nullable(),
  titleEn: z.string().min(1),
  titleKh: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  publishYear: z.coerce.number().optional().nullable(),
  category: z.string().optional().nullable(),
  deweyCode: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  totalCopies: z.coerce.number().min(1).default(1),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));

  const where = search
    ? {
        OR: [
          { titleEn: { contains: search, mode: "insensitive" as const } },
          { titleKh: { contains: search, mode: "insensitive" as const } },
          { author: { contains: search, mode: "insensitive" as const } },
          { isbn: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.book.count({ where }),
  ]);

  return NextResponse.json({ books, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const book = await prisma.book.create({
    data: {
      ...parsed.data,
      availableCopies: parsed.data.totalCopies,
    },
  });

  return NextResponse.json(book, { status: 201 });
}

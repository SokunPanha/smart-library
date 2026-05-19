import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const bookSchema = z.object({
  isbn: z.string().optional().nullable(),
  titleEn: z.string().optional().default(""),
  titleKh: z.string().min(1),
  author: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  publishYear: z.coerce.number().optional().nullable(),
  category: z.string().optional().nullable(),
  deweyCode: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  totalCopies: z.coerce.number().min(1).default(1),
  tags: z.array(z.string()).default([]),
  shelfId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const shelfId = searchParams.get("shelfId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));

  const where: Record<string, unknown> = {};
  if (shelfId) where.shelfId = shelfId;
  if (search) {
    where.OR = [
      { titleEn: { contains: search, mode: "insensitive" } },
      { titleKh: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { isbn: { contains: search, mode: "insensitive" } },
    ];
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { shelf: { select: { id: true, code: true, label: true, section: true, cabinet: true, level: true, block: true } } },
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

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const book = await prisma.book.create({
    data: {
      ...parsed.data,
      availableCopies: parsed.data.totalCopies,
      createdBy: actor,
      updatedBy: actor,
    },
  });

  await logActivity(session, "BOOK_CREATED", `Added book: ${book.titleKh ?? book.titleEn}`, book.id);
  return NextResponse.json(book, { status: 201 });
}

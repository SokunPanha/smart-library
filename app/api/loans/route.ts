import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const LOAN_DAYS: Record<string, number> = {
  STUDENT: 14,
  TEACHER: 30,
  PUBLIC: 14,
  RESEARCHER: 30,
};

const checkoutSchema = z.object({
  bookId: z.string().min(1),
  memberId: z.string().min(1),
  dueAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));

  const where = status ? { status: status as "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST" } : {};

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { borrowedAt: "desc" },
      include: {
        book: { select: { id: true, titleEn: true, titleKh: true, isbn: true } },
        member: { select: { id: true, nameEn: true, nameKh: true, memberId: true } },
      },
    }),
    prisma.loan.count({ where }),
  ]);

  return NextResponse.json({ loans, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const [book, member] = await Promise.all([
    prisma.book.findUnique({ where: { id: parsed.data.bookId } }),
    prisma.member.findUnique({ where: { id: parsed.data.memberId } }),
  ]);

  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  if (book.availableCopies < 1) {
    return NextResponse.json({ error: "No copies available." }, { status: 409 });
  }

  const days = LOAN_DAYS[member.type] ?? 14;
  const dueAt = parsed.data.dueAt
    ? new Date(parsed.data.dueAt)
    : new Date(Date.now() + days * 86400000);

  const [loan] = await prisma.$transaction([
    prisma.loan.create({
      data: {
        bookId: book.id,
        memberId: member.id,
        dueAt,
      },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true } },
      },
    }),
    prisma.book.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json(loan, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

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
  const fineUnpaid  = searchParams.get("fineUnpaid")  === "true";
  const finePaid    = searchParams.get("finePaid")    === "true";
  const fineWaived  = searchParams.get("fineWaived")  === "true";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));

  const where = {
    ...(status ? { status: status as "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST" } : {}),
    ...(fineUnpaid ? { fineAmount: { gt: 0 }, finePaid: false } : {}),
    ...(finePaid   ? { fineAmount: { gt: 0 }, finePaid: true, fineWaived: false } : {}),
    ...(fineWaived ? { fineWaived: true } : {}),
    ...(search ? {
      OR: [
        { book: { titleEn: { contains: search, mode: "insensitive" as const } } },
        { book: { titleKh: { contains: search, mode: "insensitive" as const } } },
        { book: { isbn:    { contains: search, mode: "insensitive" as const } } },
        { member: { nameEn:   { contains: search, mode: "insensitive" as const } } },
        { member: { nameKh:   { contains: search, mode: "insensitive" as const } } },
        { member: { memberId: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { borrowedAt: "desc" },
      include: {
        book: { select: { id: true, titleEn: true, titleKh: true, isbn: true, coverImage: true } },
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

  const [book, member, activeLoans, maxLoansSetting] = await Promise.all([
    prisma.book.findUnique({ where: { id: parsed.data.bookId } }),
    prisma.member.findUnique({ where: { id: parsed.data.memberId } }),
    prisma.loan.count({ where: { memberId: parsed.data.memberId, status: "ACTIVE" } }),
    prisma.setting.findUnique({ where: { key: "maxLoansPerMember" } }),
  ]);

  const maxLoans = Number(maxLoansSetting?.value ?? 5);

  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  if (book.totalCopies <= 2) {
    return NextResponse.json({ error: "This book cannot be borrowed — it has 2 or fewer copies and must stay in the library." }, { status: 409 });
  }
  if (book.availableCopies <= 2) {
    return NextResponse.json({ error: "Cannot borrow — library must keep at least 2 copies." }, { status: 409 });
  }
  if (activeLoans >= maxLoans) {
    return NextResponse.json({ error: `Member already has ${maxLoans} active loans. A book must be returned before borrowing another.` }, { status: 409 });
  }

  const days = LOAN_DAYS[member.type] ?? 14;
  const dueAt = parsed.data.dueAt
    ? new Date(parsed.data.dueAt)
    : new Date(Date.now() + days * 86400000);

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const [loan] = await prisma.$transaction([
    prisma.loan.create({
      data: {
        bookId: book.id,
        memberId: member.id,
        dueAt,
        checkedOutBy: actor,
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

  const bookTitle = loan.book.titleKh ?? loan.book.titleEn;
  const memberName = loan.member.nameKh ?? loan.member.nameEn ?? loan.member.memberId;
  await logActivity(session, "LOAN_CHECKOUT", `Checked out: "${bookTitle}" → ${memberName} (${loan.member.memberId})`, loan.id);
  return NextResponse.json(loan, { status: 201 });
}

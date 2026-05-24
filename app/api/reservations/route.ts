import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const createSchema = z.object({
  bookId: z.string().min(1),
  memberId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));

  const where = {
    ...(status ? { status: status as "PENDING" | "FULFILLED" | "CANCELLED" } : {}),
    ...(search
      ? {
          OR: [
            { book: { titleEn: { contains: search, mode: "insensitive" as const } } },
            { book: { titleKh: { contains: search, mode: "insensitive" as const } } },
            { member: { nameEn: { contains: search, mode: "insensitive" as const } } },
            { member: { nameKh: { contains: search, mode: "insensitive" as const } } },
            { member: { memberId: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ status: "asc" }, { reservedAt: "asc" }],
      include: {
        book: { select: { id: true, titleEn: true, titleKh: true, coverImage: true, availableCopies: true } },
        member: { select: { id: true, nameEn: true, nameKh: true, memberId: true } },
      },
    }),
    prisma.reservation.count({ where }),
  ]);

  return NextResponse.json({ reservations, total, page, limit });
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { bookId, memberId } = parsed.data;

  const [book, member, existingReservation, existingLoan] = await Promise.all([
    prisma.book.findUnique({ where: { id: bookId } }),
    prisma.member.findUnique({ where: { id: memberId } }),
    prisma.reservation.findFirst({
      where: { bookId, memberId, status: "PENDING" },
    }),
    prisma.loan.findFirst({
      where: { bookId, memberId, status: { in: ["ACTIVE", "OVERDUE"] } },
    }),
  ]);

  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  if (existingReservation) return NextResponse.json({ error: "ALREADY_RESERVED" }, { status: 409 });
  if (existingLoan) return NextResponse.json({ error: "ALREADY_ON_LOAN" }, { status: 409 });

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const reservation = await prisma.reservation.create({
    data: { bookId, memberId, createdBy: actor },
    include: {
      book: { select: { titleEn: true, titleKh: true } },
      member: { select: { nameEn: true, nameKh: true, memberId: true } },
    },
  });

  const bookTitle = reservation.book.titleKh ?? reservation.book.titleEn;
  const memberName = reservation.member.nameKh ?? reservation.member.nameEn ?? reservation.member.memberId;
  await logActivity(session, "RESERVATION_CREATED", `Reserved: "${bookTitle}" for ${memberName}`, reservation.id);
  return NextResponse.json(reservation, { status: 201 });
}

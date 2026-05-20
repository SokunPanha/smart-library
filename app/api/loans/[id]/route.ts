import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const FINE_PER_DAY_KHR = 500;

const returnSchema = z.object({
  status: z.literal("RETURNED"),
});

const markLostSchema = z.object({
  status: z.literal("LOST"),
  fineAmount: z.number().min(0),
  fineNote: z.string().optional().nullable(),
});

const renewSchema = z.object({
  action: z.literal("renew"),
});

const payFineSchema = z.object({
  action: z.literal("payFine"),
});

const waiveFineSchema = z.object({
  action: z.literal("waiveFine"),
  fineNote: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      book: true,
      member: true,
    },
  });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(loan);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";

  // --- Waive Fine action ---
  if (body?.action === "waiveFine") {
    const parsed = waiveFineSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true } },
      },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (loan.fineAmount === 0) return NextResponse.json({ error: "No fine on this loan." }, { status: 409 });
    if (loan.finePaid) return NextResponse.json({ error: "Fine already resolved." }, { status: 409 });

    const updated = await prisma.loan.update({
      where: { id },
      data: { finePaid: true, fineWaived: true, fineNote: parsed.data.fineNote ?? null },
    });

    const bookTitle = loan.book.titleKh ?? loan.book.titleEn;
    const memberName = loan.member.nameKh ?? loan.member.nameEn ?? loan.member.memberId;
    await logActivity(session, "FINE_WAIVED", `Fine waived: ${loan.fineAmount.toLocaleString()} KHR for "${bookTitle}" by ${memberName}${parsed.data.fineNote ? ` — ${parsed.data.fineNote}` : ""}`, id);
    return NextResponse.json(updated);
  }

  // --- Pay Fine action ---
  if (body?.action === "payFine") {
    const parsed = payFineSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true } },
      },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (loan.fineAmount === 0) return NextResponse.json({ error: "No fine on this loan." }, { status: 409 });
    if (loan.finePaid) return NextResponse.json({ error: "Fine already paid." }, { status: 409 });

    const updated = await prisma.loan.update({
      where: { id },
      data: { finePaid: true },
    });

    const bookTitle = loan.book.titleKh ?? loan.book.titleEn;
    const memberName = loan.member.nameKh ?? loan.member.nameEn ?? loan.member.memberId;
    await logActivity(session, "FINE_PAID", `Fine paid: ${loan.fineAmount.toLocaleString()} KHR for "${bookTitle}" by ${memberName}`, id);
    return NextResponse.json(updated);
  }

  // --- Renew action ---
  if (body?.action === "renew") {
    const parsed = renewSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { member: { select: { type: true } } },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (loan.status !== "ACTIVE" && loan.status !== "OVERDUE") {
      return NextResponse.json({ error: "Loan is already closed." }, { status: 409 });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["maxRenewalsPerLoan", "loanDaysStudent", "loanDaysTeacher", "loanDaysPublic", "loanDaysResearcher"] } },
    });
    const settingsMap: Record<string, string> = {
      maxRenewalsPerLoan: "2",
      loanDaysStudent: "14",
      loanDaysTeacher: "30",
      loanDaysPublic: "14",
      loanDaysResearcher: "30",
    };
    for (const s of settings) settingsMap[s.key] = s.value;

    const maxRenewals = Number(settingsMap.maxRenewalsPerLoan);
    if (loan.renewalCount >= maxRenewals) {
      return NextResponse.json({ error: "MAX_RENEWALS_REACHED", maxRenewals }, { status: 409 });
    }

    const loanDaysKey = `loanDays${loan.member.type.charAt(0) + loan.member.type.slice(1).toLowerCase()}` as keyof typeof settingsMap;
    const loanDays = Number(settingsMap[loanDaysKey] ?? "14");
    // Extend from current due date (or today if overdue), so renewal never shortens remaining time
    const baseDate = loan.dueAt > new Date() ? loan.dueAt : new Date();
    const newDueAt = new Date(baseDate);
    newDueAt.setDate(newDueAt.getDate() + loanDays);

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        dueAt: newDueAt,
        renewalCount: { increment: 1 },
        status: "ACTIVE",
      },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true, type: true } },
      },
    });

    const bookTitle = updated.book.titleKh ?? updated.book.titleEn;
    const memberName = updated.member.nameKh ?? updated.member.nameEn ?? updated.member.memberId;
    await logActivity(session, "LOAN_RENEWED", `Renewed: "${bookTitle}" by ${memberName} (renewal #${updated.renewalCount}, due ${newDueAt.toLocaleDateString()})`, id);
    return NextResponse.json(updated);
  }

  // --- Mark as Lost ---
  if (body?.status === "LOST") {
    const parsed = markLostSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (loan.status !== "ACTIVE" && loan.status !== "OVERDUE") {
      return NextResponse.json({ error: "Loan is already closed." }, { status: 409 });
    }

    const now = new Date();
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        status: "LOST",
        returnedAt: now,
        fineAmount: parsed.data.fineAmount,
        fineNote: parsed.data.fineNote ?? null,
        finePaid: false,
        closedBy: actor,
      },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true } },
      },
    });

    const bookTitle = updatedLoan.book.titleKh ?? updatedLoan.book.titleEn;
    const memberName = updatedLoan.member.nameKh ?? updatedLoan.member.nameEn ?? updatedLoan.member.memberId;
    await logActivity(session, "LOAN_LOST", `Marked lost: "${bookTitle}" by ${memberName} — fine: ${parsed.data.fineAmount.toLocaleString()} KHR${parsed.data.fineNote ? ` (${parsed.data.fineNote})` : ""}`, id);
    return NextResponse.json(updatedLoan);
  }

  // --- Return ---
  const parsed = returnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (loan.status !== "ACTIVE" && loan.status !== "OVERDUE") {
    return NextResponse.json({ error: "Loan is already closed." }, { status: 409 });
  }

  const now = new Date();
  const overdueDays = Math.max(0, Math.floor((now.getTime() - loan.dueAt.getTime()) / 86400000));
  const fineAmount = overdueDays * FINE_PER_DAY_KHR;

  const [updatedLoan] = await prisma.$transaction([
    prisma.loan.update({
      where: { id },
      data: { status: "RETURNED", returnedAt: now, fineAmount, finePaid: false, closedBy: actor },
      include: {
        book: { select: { titleEn: true, titleKh: true } },
        member: { select: { nameEn: true, nameKh: true, memberId: true } },
      },
    }),
    prisma.book.update({
      where: { id: loan.bookId },
      data: { availableCopies: { increment: 1 } },
    }),
  ]);

  const bookTitle = updatedLoan.book.titleKh ?? updatedLoan.book.titleEn;
  const memberName = updatedLoan.member.nameKh ?? updatedLoan.member.nameEn ?? updatedLoan.member.memberId;
  await logActivity(session, "LOAN_RETURNED", `Returned: "${bookTitle}" by ${memberName}${fineAmount > 0 ? ` (fine: ${fineAmount.toLocaleString()} KHR)` : ""}`, id);

  // Auto-fulfill the oldest pending reservation for this book when a copy becomes available
  if (true) {
    const nextReservation = await prisma.reservation.findFirst({
      where: { bookId: loan.bookId, status: "PENDING" },
      orderBy: { reservedAt: "asc" },
      include: { member: { select: { nameEn: true, nameKh: true, memberId: true } } },
    });
    if (nextReservation) {
      await prisma.reservation.update({
        where: { id: nextReservation.id },
        data: { status: "FULFILLED", fulfilledAt: now },
      });
      const reserveeName = nextReservation.member.nameKh ?? nextReservation.member.nameEn ?? nextReservation.member.memberId;
      await logActivity(session, "RESERVATION_FULFILLED", `"${bookTitle}" is now ready for ${reserveeName}`, nextReservation.id);
    }
  }

  return NextResponse.json(updatedLoan);
}

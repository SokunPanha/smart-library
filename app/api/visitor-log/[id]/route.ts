import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const log = await prisma.visitorLog.findUnique({
    where: { id },
    include: { member: { select: { nameKh: true, nameEn: true, memberId: true } } },
  });
  if (!log) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Checkout: set leftAt
  if (body.action === "checkout") {
    if (log.leftAt) return NextResponse.json({ error: "Already checked out." }, { status: 409 });
    const updated = await prisma.visitorLog.update({
      where: { id },
      data: { leftAt: new Date() },
      include: {
        member: { select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, class: { select: { name: true } } } },
        book: { select: { id: true, titleKh: true, titleEn: true } },
      },
    });
    await logActivity(session, "VISITOR_CHECKOUT", `${log.member.nameKh ?? log.member.nameEn} (${log.member.memberId}) checked out`);
    return NextResponse.json(updated);
  }

  // Link book
  if (body.action === "linkBook") {
    const bookId = typeof body.bookId === "string" ? body.bookId : null;
    const updated = await prisma.visitorLog.update({
      where: { id },
      data: { bookId },
      include: {
        member: { select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, class: { select: { name: true } } } },
        book: { select: { id: true, titleKh: true, titleEn: true } },
      },
    });
    const bookTitle = updated.book ? (updated.book.titleKh ?? updated.book.titleEn ?? "") : "none";
    await logActivity(session, "VISITOR_BOOK_LINKED", `${log.member.nameKh ?? log.member.nameEn} — book linked: ${bookTitle}`);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

const bookInclude = {
  books: {
    include: { book: { select: { id: true, titleKh: true, titleEn: true } } },
    orderBy: { addedAt: "asc" as const },
  },
};

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
        ...bookInclude,
      },
    });
    await logActivity(session, "VISITOR_CHECKOUT", `${log.member.nameKh ?? log.member.nameEn} (${log.member.memberId}) checked out`);
    return NextResponse.json(updated);
  }

  // Add a book to this visit
  if (body.action === "addBook") {
    const bookId = typeof body.bookId === "string" ? body.bookId : null;
    if (!bookId) return NextResponse.json({ error: "bookId required." }, { status: 422 });

    await prisma.visitorLogBook.upsert({
      where: { visitorLogId_bookId: { visitorLogId: id, bookId } },
      create: { visitorLogId: id, bookId },
      update: {},
    });

    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { titleKh: true, titleEn: true } });
    const updated = await prisma.visitorLog.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, class: { select: { name: true } } } },
        ...bookInclude,
      },
    });
    const bookTitle = book ? (book.titleKh ?? book.titleEn ?? "") : "";
    await logActivity(session, "VISITOR_BOOK_LINKED", `${log.member.nameKh ?? log.member.nameEn} — book added: ${bookTitle}`);
    return NextResponse.json(updated);
  }

  // Remove a book from this visit
  if (body.action === "removeBook") {
    const bookId = typeof body.bookId === "string" ? body.bookId : null;
    if (!bookId) return NextResponse.json({ error: "bookId required." }, { status: 422 });

    await prisma.visitorLogBook.deleteMany({ where: { visitorLogId: id, bookId } });

    const updated = await prisma.visitorLog.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, class: { select: { name: true } } } },
        ...bookInclude,
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

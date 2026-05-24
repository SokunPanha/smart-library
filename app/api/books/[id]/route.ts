import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      shelf: { select: { code: true, label: true, zone: true, cabinet: true, side: true, shelfNo: true, sectionNo: true } },
      loans: {
        include: {
          member: { select: { id: true, memberId: true, nameKh: true, nameEn: true, type: true, photo: true } },
        },
        orderBy: { borrowedAt: "desc" },
        take: 100,
      },
      reservations: {
        include: {
          member: { select: { id: true, memberId: true, nameKh: true, nameEn: true } },
        },
        orderBy: { reservedAt: "asc" },
      },
    },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(book);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { id } = await params;
  const body = await req.json();
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";
  const copiesDiff = parsed.data.totalCopies - existing.totalCopies;
  const book = await prisma.book.update({
    where: { id },
    data: {
      ...parsed.data,
      availableCopies: Math.max(0, existing.availableCopies + copiesDiff),
      updatedBy: actor,
    },
  });

  await logActivity(session, "BOOK_UPDATED", `Updated book: ${book.titleKh ?? book.titleEn}`, book.id);
  return NextResponse.json(book);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { id } = await params;
  const activeLoans = await prisma.loan.count({
    where: { bookId: id, status: "ACTIVE" },
  });
  if (activeLoans > 0) {
    return NextResponse.json(
      { error: "Cannot delete a book with active loans." },
      { status: 409 }
    );
  }

  const book = await prisma.book.findUnique({ where: { id }, select: { titleEn: true, titleKh: true } });
  await prisma.book.delete({ where: { id } });
  await logActivity(session, "BOOK_DELETED", `Deleted book: ${book?.titleKh ?? book?.titleEn}`, id);
  return new NextResponse(null, { status: 204 });
}

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(book);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copiesDiff = parsed.data.totalCopies - existing.totalCopies;
  const book = await prisma.book.update({
    where: { id },
    data: {
      ...parsed.data,
      availableCopies: Math.max(0, existing.availableCopies + copiesDiff),
    },
  });

  return NextResponse.json(book);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  await prisma.book.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

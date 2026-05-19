import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const rowSchema = z.object({
  titleKh: z.string().optional().nullable(),
  titleEn: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  publishYear: z.coerce.number().int().min(1000).max(2100).optional().nullable(),
  category: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  deweyCode: z.string().optional().nullable(),
  totalCopies: z.coerce.number().int().min(1).default(1),
  tags: z.array(z.string()).default([]),
});

const bulkSchema = z.object({
  books: z.array(rowSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";

  // Collect ISBNs that already exist to skip them
  const incomingIsbns = parsed.data.books
    .map((b) => b.isbn)
    .filter((isbn): isbn is string => !!isbn);

  const existingIsbns = new Set(
    incomingIsbns.length > 0
      ? (await prisma.book.findMany({ where: { isbn: { in: incomingIsbns } }, select: { isbn: true } })).map((b) => b.isbn!)
      : []
  );

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of parsed.data.books) {
    const title = row.titleKh || row.titleEn;
    if (!title) {
      errors.push(`Row skipped: no title provided`);
      skipped++;
      continue;
    }
    if (row.isbn && existingIsbns.has(row.isbn)) {
      skipped++;
      continue;
    }
    try {
      await prisma.book.create({
        data: {
          titleKh: row.titleKh || null,
          titleEn: row.titleEn || "",
          author: row.author || null,
          publisher: row.publisher || null,
          publishYear: row.publishYear || null,
          category: row.category || null,
          isbn: row.isbn || null,
          deweyCode: row.deweyCode || null,
          totalCopies: row.totalCopies,
          availableCopies: row.totalCopies,
          tags: row.tags,
          createdBy: actor,
          updatedBy: actor,
        },
      });
      created++;
      if (row.isbn) existingIsbns.add(row.isbn);
    } catch {
      errors.push(`Failed to import: ${title}`);
      skipped++;
    }
  }

  await logActivity(session, "BOOKS_BULK_IMPORTED", `Bulk imported ${created} book(s), skipped ${skipped}`);
  return NextResponse.json({ created, skipped, errors });
}

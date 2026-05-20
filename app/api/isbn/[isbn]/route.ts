import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface OpenLibraryBook {
  title?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  publish_date?: string;
  cover?: { small?: string; medium?: string; large?: string };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isbn } = await params;
  const clean = isbn.replace(/[^0-9X]/gi, "");

  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) return NextResponse.json(null);

  const data = (await res.json()) as Record<string, OpenLibraryBook>;
  const book = data[`ISBN:${clean}`];
  if (!book) return NextResponse.json(null);

  let publishYear: number | undefined;
  if (book.publish_date) {
    const match = String(book.publish_date).match(/\d{4}/);
    if (match) publishYear = parseInt(match[0], 10);
  }

  return NextResponse.json({
    isbn: clean,
    titleEn: book.title ?? null,
    author: book.authors?.[0]?.name ?? null,
    publisher: book.publishers?.[0]?.name ?? null,
    publishYear: publishYear ?? null,
    coverImage: book.cover?.medium ?? book.cover?.small ?? null,
  });
}

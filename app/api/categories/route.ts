import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Accept either { name } (single) or { names: string[] } (bulk)
  const rawNames: string[] = body.names
    ? body.names
    : body.name
    ? [body.name]
    : [];

  const names = [...new Set(rawNames.map((n: string) => n.trim()).filter(Boolean))];

  if (!names.length) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  // Find which names already exist
  const existing = await prisma.category.findMany({
    where: { name: { in: names } },
    select: { name: true },
  });
  const existingSet = new Set(existing.map((c) => c.name));
  const toCreate = names.filter((n) => !existingSet.has(n));

  if (!toCreate.length) {
    return NextResponse.json({ error: "Category already exists." }, { status: 409 });
  }

  if (names.length === 1) {
    const category = await prisma.category.create({ data: { name: toCreate[0] } });
    await logActivity(session, "CATEGORY_CREATED", `Added category: ${category.name}`, category.id);
    return NextResponse.json(category, { status: 201 });
  }

  await prisma.category.createMany({ data: toCreate.map((name) => ({ name })) });
  await logActivity(session, "CATEGORY_CREATED", `Bulk added ${toCreate.length} categories: ${toCreate.join(", ")}`
  );

  return NextResponse.json({ created: toCreate.length, skipped: existingSet.size }, { status: 201 });
}

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
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
  if (existing) return NextResponse.json({ error: "Category already exists." }, { status: 409 });
  const category = await prisma.category.create({ data: { name: name.trim() } });
  if (session) await logActivity(session, "CATEGORY_CREATED", `Added category: ${category.name}`, category.id);
  return NextResponse.json(category, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const classes = await prisma.class.findMany({
    orderBy: [{ grade: "asc" }, { name: "asc" }],
    include: { _count: { select: { members: true } } },
  });
  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, grade } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const existing = await prisma.class.findUnique({ where: { name: name.trim() } });
  if (existing) return NextResponse.json({ error: "Class already exists." }, { status: 409 });

  const cls = await prisma.class.create({ data: { name: name.trim(), grade: grade?.trim() || null } });
  await logActivity(session, "CLASS_CREATED", `Added class: ${cls.name}`, cls.id);
  return NextResponse.json(cls, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLog";

const ADMIN_ONLY = NextResponse.json({ error: "Forbidden" }, { status: 403 });

async function requireAdmin() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return ADMIN_ONLY;
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const users = await prisma.user.findMany({
    select: { id: true, email: true, nameEn: true, nameKh: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return ADMIN_ONLY;

  const { email, password, nameEn, nameKh, role } = await req.json();
  if (!email || !password || !nameEn) {
    return NextResponse.json({ error: "email, password, and nameEn are required" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, nameEn, nameKh, role: role ?? "LIBRARIAN" },
    select: { id: true, email: true, nameEn: true, nameKh: true, role: true, createdAt: true },
  });

  await logActivity(session, "USER_CREATED", `Created user: ${email} (${user.role})`, user.id);
  return NextResponse.json(user, { status: 201 });
}

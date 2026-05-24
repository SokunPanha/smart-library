import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const registerSchema = z.object({
  nameKh: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  phone: z.string().min(6),
  password: z.string().min(6),
  email: z.string().email().optional().nullable().or(z.literal("")),
  type: z.enum(["STUDENT", "TEACHER", "PUBLIC", "RESEARCHER"]).default("PUBLIC"),
  classId: z.string().optional().nullable(),
});

async function generateMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.member.count();
  const candidate = `MEM-${year}-${String(count + 1).padStart(4, "0")}`;
  const exists = await prisma.member.findUnique({ where: { memberId: candidate } });
  if (!exists) return candidate;
  return `MEM-${year}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { email, classId, password, ...rest } = parsed.data;

  // Normalize phone before saving and before duplicate check
  const normalizedPhone = normalizePhone(rest.phone);
  rest.phone = normalizedPhone;

  // Duplicate phone check (against normalized value)
  const phoneExists = await prisma.member.findFirst({ where: { phone: normalizedPhone } });
  if (phoneExists) {
    return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 409 });
  }

  // Duplicate email check
  if (email) {
    const emailExists = await prisma.member.findFirst({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
    }
  }

  const memberId = await generateMemberId();
  const hashedPassword = await bcrypt.hash(password, 12);

  const createData = {
    ...rest,
    email: email || null,
    classId: classId || null,
    portalApproved: false,
    portalPassword: hashedPassword,
    createdBy: "self-registered",
    updatedBy: "self-registered",
  };

  try {
    const member = await prisma.member.create({ data: { ...createData, memberId } });
    return NextResponse.json({ memberId: member.memberId }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      const fallbackId = `MEM-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
      const member = await prisma.member.create({ data: { ...createData, memberId: fallbackId } });
      return NextResponse.json({ memberId: member.memberId }, { status: 201 });
    }
    throw err;
  }
}

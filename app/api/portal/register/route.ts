import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
  const memberId = await generateMemberId();
  const hashedPassword = await bcrypt.hash(password, 12);

  const member = await prisma.member.create({
    data: {
      ...rest,
      memberId,
      email: email || null,
      classId: classId || null,
      portalApproved: false,
      portalPassword: hashedPassword,
      createdBy: "self-registered",
      updatedBy: "self-registered",
    },
  });

  return NextResponse.json({ memberId: member.memberId }, { status: 201 });
}

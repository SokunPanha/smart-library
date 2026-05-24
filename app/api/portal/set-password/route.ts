import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const schema = z.object({
  phone: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  }

  const normalizedPhone = normalizePhone(parsed.data.phone);

  const member = await prisma.member.findFirst({
    where: { phone: normalizedPhone, portalApproved: true },
    select: { id: true, portalPassword: true },
  });

  // Use a generic error to avoid leaking whether the phone is registered
  if (!member) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Only allow setting password if not yet set (first login)
  if (member.portalPassword) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  await prisma.member.update({
    where: { id: member.id },
    data: { portalPassword: hashed },
  });

  return NextResponse.json({ ok: true });
}

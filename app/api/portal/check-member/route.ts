import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("phone") ?? "";
  const phone = normalizePhone(raw);
  if (!phone) return NextResponse.json({ exists: false });

  const candidates = await prisma.member.findMany({
    where: { phone: { not: null } },
    select: { phone: true, portalApproved: true, portalPassword: true },
  });

  const member = candidates.find((m) => normalizePhone(m.phone ?? "") === phone);

  if (!member) return NextResponse.json({ exists: false });
  if (!member.portalApproved) return NextResponse.json({ exists: true, approved: false });

  return NextResponse.json({
    exists: true,
    approved: true,
    needsPassword: !member.portalPassword,
  });
}

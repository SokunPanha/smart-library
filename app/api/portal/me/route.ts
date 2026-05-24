import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePortalApi } from "@/lib/portalAuth";

export async function GET() {
  const portalAuth = await requirePortalApi();
  if (portalAuth.response) return portalAuth.response;
  const { user } = portalAuth;

  const member = await prisma.member.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      memberId: true,
      nameKh: true,
      nameEn: true,
      phone: true,
      email: true,
      photo: true,
      type: true,
      expiresAt: true,
      createdAt: true,
      class: { select: { name: true } },
      _count: {
        select: {
          loans: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

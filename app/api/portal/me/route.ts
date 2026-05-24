import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!session || user?.userType !== "MEMBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.member.findUnique({
    where: { id: user.id as string },
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

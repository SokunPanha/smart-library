import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any)?.userType !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { approved } = await req.json();

  const member = await prisma.member.update({
    where: { id },
    data: { portalApproved: approved },
  });

  const action = approved ? "PORTAL_APPROVED" : "PORTAL_REJECTED";
  const description = `${approved ? "Approved" : "Rejected"} portal access for member: ${member.nameKh ?? member.nameEn ?? member.memberId}`;
  await logActivity(session, action, description, member.id);

  return NextResponse.json(member);
}

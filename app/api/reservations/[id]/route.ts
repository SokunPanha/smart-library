import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      book: { select: { titleEn: true, titleKh: true } },
      member: { select: { nameEn: true, nameKh: true, memberId: true } },
    },
  });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reservation.status === "CANCELLED") {
    return NextResponse.json({ error: "Already cancelled." }, { status: 409 });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  const bookTitle = reservation.book.titleKh ?? reservation.book.titleEn;
  const memberName = reservation.member.nameKh ?? reservation.member.nameEn ?? reservation.member.memberId;
  await logActivity(session, "RESERVATION_CANCELLED", `Cancelled reservation: "${bookTitle}" for ${memberName}`, id);
  return NextResponse.json(updated);
}

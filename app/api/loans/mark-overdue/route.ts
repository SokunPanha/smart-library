import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { logActivity } from "@/lib/activityLog";

export async function POST() {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const result = await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  await logActivity(session, "LOANS_MARKED_OVERDUE", `Marked ${result.count} loan(s) as overdue`);
  return NextResponse.json({ marked: result.count });
}

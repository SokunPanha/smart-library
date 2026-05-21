import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  await logActivity(session, "LOANS_MARKED_OVERDUE", `Marked ${result.count} loan(s) as overdue`);
  return NextResponse.json({ marked: result.count });
}

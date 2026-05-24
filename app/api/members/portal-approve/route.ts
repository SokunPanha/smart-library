import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const schema = z.object({
  ids: z.array(z.string()).min(1),
  approved: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any)?.userType !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { ids, approved } = parsed.data;

  const { count } = await prisma.member.updateMany({
    where: { id: { in: ids } },
    data: { portalApproved: approved },
  });

  const action = approved ? "PORTAL_APPROVED" : "PORTAL_REJECTED";
  await logActivity(
    session,
    action,
    `Bulk ${approved ? "approved" : "revoked"} portal access for ${count} member(s)`
  );

  return NextResponse.json({ count });
}

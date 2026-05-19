import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

type SessionUser = { email?: string | null; name?: string | null };

export async function logActivity(
  session: Session,
  action: string,
  description: string,
  entityId?: string
) {
  const user = session.user as SessionUser;
  await prisma.activityLog
    .create({
      data: {
        userEmail: user.email ?? "unknown",
        userName: user.name ?? user.email ?? "unknown",
        action,
        description,
        entityId: entityId ?? null,
      },
    })
    .catch(() => {});
}

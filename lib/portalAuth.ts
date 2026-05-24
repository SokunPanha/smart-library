import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * For API routes: validates JWT + re-checks portalApproved from DB.
 * Returns { user } on success or { response: 401 } to return immediately.
 */
export async function requirePortalApi(): Promise<
  | { user: { id: string }; response?: never }
  | { user?: never; response: NextResponse }
> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = session?.user as any;

  if (!session || raw?.userType !== "MEMBER") {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const member = await prisma.member.findUnique({
    where: { id: raw.id as string },
    select: { portalApproved: true },
  });

  if (!member?.portalApproved) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user: { id: raw.id as string } };
}

export async function requireMemberSession(locale: string) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!session || user?.userType !== "MEMBER") {
    redirect(`/${locale}/login`);
  }
  return {
    id: user.id as string,
    memberId: user.memberId as string,
    name: (user.name ?? user.memberId) as string,
  };
}

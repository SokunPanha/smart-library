import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * For portal API routes: validates JWT + re-checks portalApproved from DB.
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

/**
 * For admin API routes: validates JWT + ensures userType is ADMIN.
 */
export async function requireAdminApi(): Promise<
  | { session: Session; response?: never }
  | { session?: never; response: NextResponse }
> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = session?.user as any;
  if (!session || raw?.userType !== "ADMIN") {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

/**
 * For portal server page components: validates JWT + re-checks portalApproved from DB.
 */
export async function requireMemberSession(locale: string) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!session || user?.userType !== "MEMBER") {
    redirect(`/${locale}/login`);
  }

  const member = await prisma.member.findUnique({
    where: { id: user.id as string },
    select: { portalApproved: true },
  });
  if (!member?.portalApproved) {
    redirect(`/${locale}/login`);
  }

  return {
    id: user.id as string,
    memberId: user.memberId as string,
    name: (user.name ?? user.memberId) as string,
  };
}

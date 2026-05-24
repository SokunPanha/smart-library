import { auth } from "@/auth";
import { redirect } from "next/navigation";

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

import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let next-intl handle locale routing first
  const intlResponse = intlMiddleware(request);

  const locale = pathname.split("/")[1] || "en";

  // Protect admin routes — must be authenticated as ADMIN/LIBRARIAN/STAFF
  const isAdminProtectedPath =
    /^\/(en|km)\/admin\/(dashboard|catalog|members|circulation|reports|settings|visitor-log|logs|map)/.test(pathname);

  if (isAdminProtectedPath) {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userType = (session?.user as any)?.userType;
    if (!session || userType !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
  }

  // Protect member portal routes — must be authenticated as MEMBER
  const isMemberProtectedPath =
    /^\/(en|km)\/(dashboard|loans|card|visits)/.test(pathname);

  if (isMemberProtectedPath) {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userType = (session?.user as any)?.userType;
    if (!session || userType !== "MEMBER") {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

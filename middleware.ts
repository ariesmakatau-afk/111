import { NextResponse, type NextRequest } from "next/server";

// Duplicated from lib/session.ts on purpose: importing that module here
// would pull node:crypto into the Edge bundle, which isn't supported.
const SESSION_COOKIE = "yiannis_staff";

// Gate for the two staff areas.
//
// Middleware runs on the Edge runtime, which has no node:crypto — so the
// signature is verified inside the pages/routes themselves, not here. This
// layer only checks that a cookie is present, which is enough to bounce
// anonymous visitors to the login screen without a flash of protected UI.
// The real check happens server-side where it can't be bypassed.

export function middleware(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasCookie) return NextResponse.next();

  const loginUrl = new URL("/staff", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/kitchen/:path*", "/admin/:path*"],
};

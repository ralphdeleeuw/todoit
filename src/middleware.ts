import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAppRoute = nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/list") ||
    nextUrl.pathname.startsWith("/family") ||
    nextUrl.pathname.startsWith("/settings");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/onboarding");

  if (!isLoggedIn && isAppRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // @ts-expect-error: extended session fields
  const hasFamilyId = !!session?.user?.familyId;

  if (isLoggedIn && !hasFamilyId && isAppRoute) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl));
  }

  if (isLoggedIn && hasFamilyId && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest).*)"],
};

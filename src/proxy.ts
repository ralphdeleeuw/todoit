import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!session?.user;

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/list") ||
    pathname.startsWith("/family") ||
    pathname.startsWith("/settings");

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding");

  if (!isLoggedIn && isAppRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const hasFamilyId = !!session?.user?.familyId;

  if (isLoggedIn && !hasFamilyId && isAppRoute) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (isLoggedIn && hasFamilyId && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest|sw\\.js).*)"],
};

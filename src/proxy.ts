import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/list", "/family", "/settings"];
const authRoutes = ["/login", "/onboarding"];

export default async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = req.nextUrl;
  const isLoggedIn = !!token;
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const hasFamilyId = !!(token as { familyId?: string } | null)?.familyId;

  if (isLoggedIn && !hasFamilyId && isProtected) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (isLoggedIn && hasFamilyId && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|icons|manifest|sw\\.js).*)"],
};

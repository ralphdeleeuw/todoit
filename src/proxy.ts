import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/list", "/family", "/settings"];
const authRoutes = ["/login", "/onboarding"];

async function getSession(req: NextRequest) {
  const secureCookie = req.cookies.get("__Secure-authjs.session-token");
  const regularCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("next-auth.session-token");

  const found = secureCookie ?? regularCookie;
  const salt = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  if (!found?.value) return null;

  try {
    const payload = await decode({
      token: found.value,
      secret: process.env.AUTH_SECRET!,
      salt,
    });
    if (!payload?.sub) return null;
    return {
      familyId: (payload as Record<string, unknown>).familyId as
        | string
        | null
        | undefined,
    };
  } catch {
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (!isProtected && !isAuthRoute) return NextResponse.next();

  const session = await getSession(req);
  const isLoggedIn = !!session;
  const hasFamilyId = !!session?.familyId;
  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && hasFamilyId && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|icons|manifest|sw\\.js).*)",
  ],
};

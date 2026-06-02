import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

type SessionPayload = {
  id: string;
  familyId?: string | null;
  role?: "PARENT" | "CHILD";
};

// Wrapped in React `cache` so a single server render (proxy aside) decodes the
// JWT at most once even when the layout, page and DAL helpers all ask for it.
export const getSessionPayload = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();

  const secureCookie = cookieStore.get("__Secure-authjs.session-token");
  const regularCookie = cookieStore.get("authjs.session-token")
    ?? cookieStore.get("next-auth.session-token");

  const { cookie: foundCookie, salt } = secureCookie
    ? { cookie: secureCookie, salt: "__Secure-authjs.session-token" }
    : { cookie: regularCookie, salt: "authjs.session-token" };

  if (!foundCookie?.value) return null;

  try {
    const payload = await decode({
      token: foundCookie.value,
      secret: process.env.AUTH_SECRET!,
      salt,
    });
    if (!payload?.sub) return null;
    return {
      id: payload.sub,
      familyId: (payload as Record<string, unknown>).familyId as string | null,
      role: (payload as Record<string, unknown>).role as "PARENT" | "CHILD" | undefined,
    };
  } catch {
    return null;
  }
});

export async function verifySession(): Promise<SessionPayload> {
  const session = await getSessionPayload();
  if (!session) redirect("/login");
  return session;
}

export async function verifyFamily(): Promise<SessionPayload & { familyId: string }> {
  const session = await verifySession();
  if (session.familyId) return session as SessionPayload & { familyId: string };
  // JWT token may be stale (e.g. family was just created). Fall back to DB.
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { familyId: true, role: true },
  });
  if (!user?.familyId) redirect("/onboarding");
  return { ...session, familyId: user.familyId, role: user.role ?? session.role };
}

export async function getFullUser(): Promise<User> {
  const session = await verifySession();
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/login");
  return user;
}

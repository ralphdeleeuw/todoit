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

async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  // NextAuth v5 uses these cookie names
  const token =
    cookieStore.get("__Secure-authjs.session-token")?.value ??
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value;

  if (!token) return null;

  try {
    const payload = await decode({
      token,
      secret: process.env.AUTH_SECRET!,
      salt: token.startsWith("__Secure") ? "__Secure-authjs.session-token" : "authjs.session-token",
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
}

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSessionPayload();
  if (!session) redirect("/login");
  return session;
});

export const verifyFamily = cache(async (): Promise<SessionPayload & { familyId: string }> => {
  const session = await verifySession();
  if (!session.familyId) redirect("/onboarding");
  return session as SessionPayload & { familyId: string };
});

export async function getFullUser(): Promise<User> {
  const session = await verifySession();
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/login");
  return user;
}

import { getSessionPayload } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export async function requireAuth(): Promise<User> {
  const session = await getSessionPayload();
  if (!session?.id) throw new Response("Unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) throw new Response("User not found", { status: 401 });
  return user;
}

export async function requireFamily(): Promise<User & { familyId: string }> {
  const user = await requireAuth();
  if (!user.familyId) throw new Response("No family", { status: 403 });
  return user as User & { familyId: string };
}

export async function requireParent(): Promise<User & { familyId: string }> {
  const user = await requireFamily();
  if (user.role !== "PARENT") throw new Response("Forbidden", { status: 403 });
  return user;
}

export function apiError(e: unknown): Response {
  if (e instanceof Response) return e;
  console.error(e);
  return new Response("Internal server error", { status: 500 });
}

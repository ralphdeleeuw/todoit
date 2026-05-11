import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export async function requireAuth(): Promise<User> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Response("User not found", { status: 401 });
  return user;
}

export async function requireFamily(): Promise<User & { familyId: string }> {
  const user = await requireAuth();
  if (!user.familyId) {
    throw new Response("No family", { status: 403 });
  }
  return user as User & { familyId: string };
}

export async function requireParent(): Promise<User & { familyId: string }> {
  const user = await requireFamily();
  if (user.role !== "PARENT") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export function apiError(res: Response | unknown): Response {
  if (res instanceof Response) return res;
  console.error(res);
  return new Response("Internal server error", { status: 500 });
}

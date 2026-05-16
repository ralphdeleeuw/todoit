import { getSessionPayload } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { User, FamilyRole } from "@prisma/client";

type SessionUser = { id: string; familyId: string; role: FamilyRole };
type AuthUser = { id: string; familyId: string | null | undefined; role: FamilyRole | undefined };

// Session-only auth check (no DB query).
export async function requireAuth(): Promise<AuthUser> {
  const session = await getSessionPayload();
  if (!session?.id) throw new Response("Unauthorized", { status: 401 });
  return { id: session.id, familyId: session.familyId, role: session.role as FamilyRole | undefined };
}

// Use JWT session data to avoid an extra DB round-trip on every API call.
// id, familyId and role are stored in the token by the NextAuth callbacks.
export async function requireFamily(): Promise<SessionUser> {
  const session = await getSessionPayload();
  if (!session?.id) throw new Response("Unauthorized", { status: 401 });
  if (!session.familyId) throw new Response("No family", { status: 403 });
  return {
    id: session.id,
    familyId: session.familyId,
    role: (session.role ?? "CHILD") as FamilyRole,
  };
}

export async function requireParent(): Promise<SessionUser> {
  const user = await requireFamily();
  if (user.role !== "PARENT") throw new Response("Forbidden", { status: 403 });
  return user;
}

// Full DB fetch — only use when you genuinely need fields beyond id/familyId/role.
export async function requireFullUser(): Promise<User & { familyId: string }> {
  const session = await getSessionPayload();
  if (!session?.id) throw new Response("Unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.familyId) throw new Response("Unauthorized", { status: 401 });
  return user as User & { familyId: string };
}

export function apiError(e: unknown): Response {
  if (e instanceof Response) return e;
  console.error(e);
  return new Response("Internal server error", { status: 500 });
}

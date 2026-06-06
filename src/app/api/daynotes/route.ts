import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canAccessTracker } from "@/lib/permissions";

/** Resolve the target child and verify the caller is a parent in the same family. */
async function resolveParentAccess(
  user: { id: string; familyId: string; role: string },
  childId: string | null,
) {
  if (user.role !== "PARENT") return { error: "Alleen ouders kunnen notities beheren", status: 403 };
  const targetId = childId ?? user.id;
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { familyId: true },
  });
  if (
    !targetUser?.familyId ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !canAccessTracker(user as any, targetId, targetUser.familyId)
  ) {
    return { error: "Geen toegang", status: 403 };
  }
  return { targetId };
}

/** GET /api/daynotes?child=<id>&month=YYYY-MM */
export async function GET(req: Request) {
  try {
    const user = await requireFamily();
    const { searchParams } = new URL(req.url);
    const access = await resolveParentAccess(user, searchParams.get("child"));
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const notes = await prisma.dayNote.findMany({
      where: { userId: access.targetId },
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ notes });
  } catch (e) {
    return apiError(e);
  }
}

/** PUT /api/daynotes — upsert (or clear) a note for one day. */
export async function PUT(req: Request) {
  try {
    const user = await requireFamily();
    const body = await req.json();
    const { date, note, child } = body as { date: string; note: string; child?: string };

    if (!date) {
      return NextResponse.json({ error: "date is verplicht" }, { status: 400 });
    }

    const access = await resolveParentAccess(user, child ?? null);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const noteDate = new Date(date + "T00:00:00.000Z");
    const trimmed = (note ?? "").trim();

    // Empty note clears any existing one.
    if (!trimmed) {
      await prisma.dayNote.deleteMany({
        where: { userId: access.targetId, date: noteDate },
      });
      return NextResponse.json({ note: null });
    }

    const saved = await prisma.dayNote.upsert({
      where: { userId_date: { userId: access.targetId, date: noteDate } },
      create: {
        userId: access.targetId,
        date: noteDate,
        note: trimmed,
        createdById: user.id,
      },
      update: { note: trimmed },
    });

    return NextResponse.json({ note: saved });
  } catch (e) {
    return apiError(e);
  }
}

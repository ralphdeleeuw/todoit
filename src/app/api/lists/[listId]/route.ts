import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ listId: string }> };

async function getOwnedList(listId: string, userId: string, familyId: string) {
  const list = await prisma.taskList.findUnique({ where: { id: listId } });
  if (!list || list.familyId !== familyId) return null;
  // owner or parent can manage
  return list;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { listId } = await ctx.params;
    const list = await getOwnedList(listId, user.id, user.familyId);
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (list.ownerId !== user.id && user.role !== "PARENT") {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const { name, color, visibility, memberIds } = await req.json();
    const vis = ["PRIVATE", "FAMILY", "SHARED"].includes(visibility) ? visibility : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (vis === "SHARED" && Array.isArray(memberIds)) {
        await tx.taskListMember.deleteMany({ where: { listId } });
        if (memberIds.length > 0) {
          await tx.taskListMember.createMany({
            data: memberIds.map((id: string) => ({ listId, userId: id })),
          });
        }
      } else if (vis && vis !== "SHARED") {
        await tx.taskListMember.deleteMany({ where: { listId } });
      }

      return tx.taskList.update({
        where: { id: listId },
        data: {
          ...(name != null ? { name } : {}),
          ...(color !== undefined ? { color: color || null } : {}),
          ...(vis ? { visibility: vis as "PRIVATE" | "FAMILY" | "SHARED" } : {}),
        },
        include: { members: { select: { userId: true } } },
      });
    });

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { listId } = await ctx.params;
    const list = await getOwnedList(listId, user.id, user.familyId);
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (list.ownerId !== user.id && user.role !== "PARENT") {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    await prisma.taskList.delete({ where: { id: listId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}

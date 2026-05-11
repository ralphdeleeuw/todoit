import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent, apiError } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ listId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireParent();
    const { listId } = await ctx.params;
    const { name, color } = await req.json();
    const list = await prisma.taskList.findUnique({ where: { id: listId } });
    if (!list || list.familyId !== user.familyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.taskList.update({
      where: { id: listId },
      data: { name: name ?? undefined, color: color ?? undefined },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireParent();
    const { listId } = await ctx.params;
    const list = await prisma.taskList.findUnique({ where: { id: listId } });
    if (!list || list.familyId !== user.familyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.taskList.delete({ where: { id: listId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}

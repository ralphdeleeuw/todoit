import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { sendPushToUser } from "@/lib/push";

const taskInclude = {
  assignee: { select: { id: true, name: true, image: true } },
  createdBy: { select: { id: true, name: true } },
  list: { select: { id: true, name: true, color: true, points: true } },
  labels: { include: { label: { select: { id: true, name: true, color: true } } } },
  subtasks: { select: { id: true, title: true, completedAt: true } },
} as const;

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { taskId } = await ctx.params;

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || existing.familyId !== user.familyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!existing.openForClaim) {
      return NextResponse.json({ error: "Task is not open for claim" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: user.id, openForClaim: false },
      include: taskInclude,
    });

    if (existing.createdById !== user.id) {
      const claimer = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
      await sendPushToUser(existing.createdById, {
        title: "Taak opgepakt",
        body: `"${task.title}" is opgepakt door ${claimer?.name ?? "iemand"}`,
        url: "/dashboard",
      });
    }

    return NextResponse.json(task);
  } catch (e) {
    return apiError(e);
  }
}

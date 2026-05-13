import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canReadTask, canEditTask, canAssignToOthers } from "@/lib/permissions";
import { sendPushToUser } from "@/lib/push";

const taskInclude = {
  assignee: { select: { id: true, name: true, image: true } },
  createdBy: { select: { id: true, name: true } },
  list: { select: { id: true, name: true, color: true, points: true } },
  labels: { include: { label: { select: { id: true, name: true, color: true } } } },
  subtasks: { select: { id: true, title: true, completedAt: true } },
} as const;

type Ctx = { params: Promise<{ taskId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { taskId } = await ctx.params;
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: taskInclude });
    if (!task || !canReadTask(user, task)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { taskId } = await ctx.params;
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || !canEditTask(user, existing)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const prevAssigneeId = existing.assigneeId;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
        reminderAt: body.reminderAt !== undefined ? (body.reminderAt ? new Date(body.reminderAt) : null) : undefined,
        listId: body.listId !== undefined ? body.listId : undefined,
        assigneeId: canAssignToOthers(user) && body.assigneeId !== undefined ? body.assigneeId : undefined,
        isRecurring: body.isRecurring ?? undefined,
        recurrenceInterval: body.recurrenceInterval ?? undefined,
        labels: body.labelIds !== undefined
          ? { deleteMany: {}, create: body.labelIds.map((id: string) => ({ labelId: id })) }
          : undefined,
      },
      include: taskInclude,
    });

    const newAssigneeId = task.assigneeId;
    if (newAssigneeId && newAssigneeId !== prevAssigneeId) {
      await sendPushToUser(newAssigneeId, {
        title: "Taak aan jou toegewezen",
        body: `"${task.title}" is aan jou toegewezen`,
        url: "/dashboard",
      });
    }

    return NextResponse.json(task);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { taskId } = await ctx.params;
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || !canEditTask(user, existing)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.task.delete({ where: { id: taskId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}

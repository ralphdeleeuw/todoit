import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canAssignToOthers } from "@/lib/permissions";

const taskInclude = {
  assignee: { select: { id: true, name: true, image: true } },
  createdBy: { select: { id: true, name: true } },
  list: { select: { id: true, name: true, color: true } },
  labels: { include: { label: { select: { id: true, name: true, color: true } } } },
  subtasks: { select: { id: true, title: true, completedAt: true } },
} as const;

export async function GET(req: Request) {
  try {
    const user = await requireFamily();
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = { familyId: user.familyId, subtaskParentId: null };

    if (user.role === "CHILD") {
      where.OR = [{ assigneeId: user.id }, { createdById: user.id }];
    }

    const listId = searchParams.get("listId");
    if (listId) where.listId = listId;

    const assigneeId = searchParams.get("assigneeId");
    if (assigneeId && user.role === "PARENT") where.assigneeId = assigneeId;

    const completed = searchParams.get("completed");
    if (completed === "true") {
      where.completedAt = { not: null };
    } else if (completed !== "true") {
      where.completedAt = null;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFamily();
    const body = await req.json();

    const assigneeId = canAssignToOthers(user) ? (body.assigneeId ?? user.id) : user.id;

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
        familyId: user.familyId,
        listId: body.listId ?? null,
        assigneeId,
        createdById: user.id,
        isRecurring: body.isRecurring ?? false,
        recurrenceInterval: body.recurrenceInterval ?? null,
        subtaskParentId: body.subtaskParentId ?? null,
        labels: body.labelIds?.length
          ? { create: body.labelIds.map((id: string) => ({ labelId: id })) }
          : undefined,
      },
      include: taskInclude,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

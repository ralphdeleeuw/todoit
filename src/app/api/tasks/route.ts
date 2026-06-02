import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canAssignToOthers } from "@/lib/permissions";
import { buildTaskWhere, taskInclude, taskOrderBy } from "@/lib/queries";

export async function GET(req: Request) {
  try {
    const user = await requireFamily();
    const { searchParams } = new URL(req.url);

    const completed = searchParams.get("completed");
    const takeParam = searchParams.get("take");
    const take = takeParam ? parseInt(takeParam, 10) : undefined;

    const where = buildTaskWhere({
      familyId: user.familyId,
      userId: user.id,
      role: user.role,
      listId: searchParams.get("listId"),
      assigneeId: searchParams.get("assigneeId"),
      completed,
    });

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: taskOrderBy(completed),
      ...(take ? { take } : {}),
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

    const openForClaim = canAssignToOthers(user) ? (body.openForClaim ?? false) : false;
    const assigneeId = openForClaim ? null : (canAssignToOthers(user) ? (body.assigneeId ?? user.id) : user.id);

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
        points: body.points != null ? Number(body.points) : null,
        familyId: user.familyId,
        listId: body.listId ?? null,
        assigneeId,
        openForClaim,
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

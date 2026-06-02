import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FamilyRole } from "@prisma/client";

// Shared task include — kept identical to what the /api/tasks routes return so
// that server-seeded SWR fallback data and client revalidation have the same shape.
export const taskInclude = {
  assignee: { select: { id: true, name: true, image: true } },
  createdBy: { select: { id: true, name: true } },
  list: { select: { id: true, name: true, color: true, points: true, effect: true } },
  labels: { include: { label: { select: { id: true, name: true, color: true } } } },
  subtasks: { select: { id: true, title: true, completedAt: true } },
} satisfies Prisma.TaskInclude;

// Single source of truth for task visibility filtering (PARENT sees all family
// tasks; a CHILD only sees open-for-claim / assigned-to-them / created-by-them).
export function buildTaskWhere(opts: {
  familyId: string;
  userId: string;
  role: FamilyRole;
  listId?: string | null;
  assigneeId?: string | null;
  completed?: string | null;
}): Prisma.TaskWhereInput {
  const { familyId, userId, role, listId, assigneeId, completed } = opts;
  const where: Prisma.TaskWhereInput = { familyId, subtaskParentId: null };

  const childFilter: Prisma.TaskWhereInput[] | null =
    role !== "PARENT"
      ? [{ openForClaim: true }, { assigneeId: userId }, { createdById: userId }]
      : null;

  if (listId) {
    where.listId = listId;
    if (childFilter) where.OR = childFilter;
  } else if (childFilter) {
    where.OR = childFilter;
  }

  if (assigneeId && role === "PARENT") where.assigneeId = assigneeId;

  if (completed === "true") where.completedAt = { not: null };
  else if (completed === "false") where.completedAt = null;

  return where;
}

export function taskOrderBy(completed?: string | null): Prisma.TaskOrderByWithRelationInput[] {
  return completed === "true"
    ? [{ completedAt: "desc" }]
    : [{ dueDate: "asc" }, { createdAt: "desc" }];
}

// Per-request memoized so the dashboard server page can seed SWR without an
// extra query when the same data is also needed elsewhere in the render.
export const getActiveTasks = cache((familyId: string, userId: string, role: FamilyRole) =>
  prisma.task.findMany({
    where: buildTaskWhere({ familyId, userId, role, completed: "false" }),
    include: taskInclude,
    orderBy: taskOrderBy("false"),
  })
);

// Visibility filtering done in SQL (was: load every list + members, filter in JS).
export const getVisibleLists = cache((familyId: string, userId: string) =>
  prisma.taskList.findMany({
    where: {
      familyId,
      OR: [
        { visibility: "FAMILY" },
        { ownerId: userId },
        { visibility: "SHARED", members: { some: { userId } } },
      ],
    },
    include: { members: { select: { userId: true } } },
    orderBy: { name: "asc" },
  })
);

export const getFamilyMembers = cache((familyId: string) =>
  prisma.user.findMany({
    where: { familyId },
    select: { id: true, name: true, image: true, role: true, xp: true, weekXp: true, streak: true },
    orderBy: { name: "asc" },
  })
);

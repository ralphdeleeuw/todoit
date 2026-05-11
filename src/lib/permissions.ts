import type { FamilyRole } from "@prisma/client";

type Viewer = { id: string; role: FamilyRole; familyId: string | null };
type TaskLike = { familyId: string; assigneeId: string | null; createdById: string };

export function canReadTask(viewer: Viewer, task: TaskLike): boolean {
  if (!viewer.familyId || viewer.familyId !== task.familyId) return false;
  if (viewer.role === "PARENT") return true;
  return task.assigneeId === viewer.id || task.createdById === viewer.id;
}

export function canEditTask(viewer: Viewer, task: TaskLike): boolean {
  return canReadTask(viewer, task);
}

export function canManageFamily(viewer: Viewer): boolean {
  return viewer.role === "PARENT";
}

export function canAssignToOthers(viewer: Viewer): boolean {
  return viewer.role === "PARENT";
}

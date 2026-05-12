import type { User, Task, TaskList, Label, Family, FamilyRole } from "@prisma/client";

export type { User, Task, TaskList, Label, Family, FamilyRole };

export type SubtaskSummary = {
  id: string;
  title: string;
  completedAt: Date | null;
};

export type TaskWithRelations = Task & {
  assignee: Pick<User, "id" | "name" | "image"> | null;
  createdBy: Pick<User, "id" | "name"> | null;
  list: Pick<TaskList, "id" | "name" | "color"> | null;
  labels: { label: Pick<Label, "id" | "name" | "color"> }[];
  subtasks: SubtaskSummary[];
};

export type FamilyMember = Pick<User, "id" | "name" | "email" | "image" | "role">;

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  familyId?: string | null;
  role?: FamilyRole;
};

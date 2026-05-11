import type { User, Task, TaskList, Label, Family, FamilyRole } from "@prisma/client";

export type { User, Task, TaskList, Label, Family, FamilyRole };

export type TaskWithRelations = Task & {
  assignee: Pick<User, "id" | "name" | "image"> | null;
  createdBy: Pick<User, "id" | "name"> | null;
  list: Pick<TaskList, "id" | "name" | "color"> | null;
  labels: { label: Pick<Label, "id" | "name" | "color"> }[];
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

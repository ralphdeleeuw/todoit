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
  list: Pick<TaskList, "id" | "name" | "color" | "points" | "effect"> | null;
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

// ── Arcade types ──────────────────────────────────────────────────────────────

export type ArcadeMember = {
  id: string;
  name: string | null;
  email?: string | null;
  image: string | null;
  role: FamilyRole;
  xp: number;
  weekXp: number;
  streak: number;
  level: number;
};

export type CompleteResult = {
  completedTask: Task;
  nextTask: Task | null;
  xp: number;
  weekXp: number;
  streak: number;
  levelUp: boolean;
  newLevel: number;
};


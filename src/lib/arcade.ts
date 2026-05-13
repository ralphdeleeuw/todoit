export type CategoryId = "huishouden" | "klusjes" | "school" | "kamperen" | "persoonlijk";
export type TaskBucket = "overdue" | "today" | "tomorrow" | "week" | "later";

export const CATEGORIES: Record<
  CategoryId,
  { label: string; color: string; points: number; emoji: string }
> = {
  huishouden:  { label: "Huishouden",            color: "#6366f1", points: 25, emoji: "🧹" },
  klusjes:     { label: "Klusjes",               color: "#f59e0b", points: 15, emoji: "🔧" },
  school:      { label: "School",                color: "#10b981", points: 10, emoji: "📚" },
  kamperen:    { label: "Inpaklijst kamperen",   color: "#a855f7", points:  5, emoji: "🏕️" },
  persoonlijk: { label: "Persoonlijk",           color: "#64748b", points:  5, emoji: "✨" },
};

// Maps list color → closest category for left-border accent
export const DEFAULT_CATEGORY_COLOR = "#6366f1";

export function calcLevel(totalXp: number): number {
  return Math.floor(totalXp / 500) + 1;
}

export function xpIntoCurrentLevel(totalXp: number): number {
  return totalXp % 500;
}

export function xpToNextLevel(totalXp: number): number {
  return 500 - (totalXp % 500);
}

export function levelDidCross(prevXp: number, nextXp: number): boolean {
  return calcLevel(nextXp) > calcLevel(prevXp);
}

export function bucketTask(dueDate: Date | null | undefined): TaskBucket {
  if (!dueDate) return "later";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.round(
    (dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays < 7) return "week";
  return "later";
}

export const BUCKET_META: Record<
  TaskBucket,
  { label: string; emoji: string; color: string }
> = {
  overdue:  { label: "TE LAAT",    emoji: "🚨", color: "#f43f5e" },
  today:    { label: "VANDAAG",    emoji: "⚡", color: "#f59e0b" },
  tomorrow: { label: "MORGEN",     emoji: "🌅", color: "#7c3aed" },
  week:     { label: "DEZE WEEK",  emoji: "📆", color: "#06d6c4" },
  later:    { label: "LATER",      emoji: "🗓️", color: "#8e8eb6" },
};

export const BUCKET_ORDER: TaskBucket[] = ["overdue", "today", "tomorrow", "week", "later"];

export const COMPLETE_COMPLIMENTS = [
  "Power-up! 💥",
  "Mission complete!",
  "Combo!",
  "Boom! 🚀",
  "Klusbaas!",
  "Goed bezig!",
  "Yes! 🎉",
];

export function randomCompliment(): string {
  return COMPLETE_COMPLIMENTS[Math.floor(Math.random() * COMPLETE_COMPLIMENTS.length)];
}

// Determine left-border color from list color or fall back to default
export function listColor(color: string | null | undefined): string {
  return color ?? DEFAULT_CATEGORY_COLOR;
}

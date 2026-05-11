"use client";

import { useState } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, RefreshCw, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { format, isToday } from "date-fns";
import { nl } from "date-fns/locale";

interface FamilyMember {
  id: string;
  name: string | null;
  image: string | null;
}

interface TaskList {
  id: string;
  name: string;
  color: string | null;
}

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskCardProps {
  task: TaskWithRelations;
  members: FamilyMember[];
  lists: TaskList[];
  labels: TaskLabel[];
  isParent: boolean;
  currentUserId: string;
  onUpdated: (task: TaskWithRelations) => void;
  onDeleted: (taskId: string) => void;
  onCompleted: (taskId: string) => void;
}

function formatDueDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return "Vandaag";
  return format(d, "d MMM", { locale: nl });
}

function dueDateColor(date: Date | string | null | undefined): string {
  if (!date) return "";
  if (isOverdue(date)) return "text-red-500 dark:text-red-400";
  if (isToday(new Date(date))) return "text-orange-500 dark:text-orange-400";
  return "text-gray-400 dark:text-gray-500";
}

export function TaskCard({
  task,
  members,
  lists,
  labels,
  isParent,
  currentUserId,
  onUpdated,
  onDeleted,
  onCompleted,
}: TaskCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const isCompleted = !!task.completedAt;

  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    if (isCompleted || completing) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
      if (res.ok) {
        onCompleted(task.id);
      }
    } finally {
      setCompleting(false);
    }
  }

  return (
    <>
      <div
        onClick={() => setSheetOpen(true)}
        className={cn(
          "group flex items-start gap-3 p-3.5 rounded-xl border bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all",
          isCompleted
            ? "border-gray-100 dark:border-gray-800 opacity-60"
            : "border-[var(--border)] shadow-sm hover:shadow"
        )}
      >
        {/* Checkbox */}
        <button
          disabled={isCompleted || completing}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            isCompleted
              ? "bg-indigo-600 border-indigo-600"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400"
          )}
          onClick={handleComplete}
          aria-label={isCompleted ? "Taak voltooid" : "Markeer als voltooid"}
        >
          {(isCompleted || completing) && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm font-medium leading-snug",
                isCompleted
                  ? "line-through text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-white"
              )}
            >
              {task.title}
            </span>

            {/* Assignee avatar */}
            {task.assignee && (
              <div className="shrink-0 ml-1">
                {task.assignee.image ? (
                  <img
                    src={task.assignee.image}
                    alt={task.assignee.name ?? ""}
                    className="w-6 h-6 rounded-full object-cover"
                    title={task.assignee.name ?? undefined}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-medium"
                    title={task.assignee.name ?? undefined}
                  >
                    {(task.assignee.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1">
            {/* Due date */}
            {task.dueDate && (
              <span className={cn("flex items-center gap-1 text-xs", dueDateColor(task.dueDate))}>
                <CalendarDays className="w-3 h-3" />
                {formatDueDate(task.dueDate)}
              </span>
            )}

            {/* Recurring */}
            {task.isRecurring && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <RefreshCw className="w-3 h-3" />
                {task.recurrenceInterval ? `${task.recurrenceInterval}d` : "Herhalend"}
              </span>
            )}

            {/* List */}
            {task.list && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: task.list.color ?? "#6366f1" }}
                />
                {task.list.name}
              </span>
            )}

            {/* Labels */}
            {task.labels.slice(0, 3).map(({ label }) => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      <TaskDetailSheet
        task={task}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        members={members}
        lists={lists}
        labels={labels}
        isParent={isParent}
        currentUserId={currentUserId}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
      />
    </>
  );
}

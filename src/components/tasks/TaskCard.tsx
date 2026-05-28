"use client";

import { useState } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, RefreshCw, CalendarDays, ListChecks, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { CompletionEffect, EFFECT_DURATION } from "./CompletionEffect";
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
  effect?: string | null;
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
  const [claiming, setClaiming] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [showEffect, setShowEffect] = useState(false);
  const isCompleted = !!task.completedAt;

  async function handleClaim(e: React.MouseEvent) {
    e.stopPropagation();
    setClaiming(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/claim`, { method: "POST" });
      if (res.ok) onUpdated(await res.json());
    } finally {
      setClaiming(false);
    }
  }

  async function doComplete(permanent: boolean) {
    setCompleting(true);
    setRecurringDialogOpen(false);
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permanent }),
      });
      if (res.ok) {
        const effect = task.list?.effect ?? "none";
        if (effect !== "none") {
          setShowEffect(true);
          // onCompleted is called via onDismiss after the animation
        } else {
          onCompleted(task.id);
        }
      }
    } finally {
      setCompleting(false);
    }
  }

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    if (isCompleted || completing) return;
    if (task.isRecurring) {
      setRecurringDialogOpen(true);
    } else {
      doComplete(false);
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
        <div className="relative shrink-0 mt-0.5">
          <button
            disabled={isCompleted || completing}
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
              isCompleted
                ? "bg-indigo-600 border-indigo-600"
                : "border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400"
            )}
            onClick={handleComplete}
            aria-label={isCompleted ? "Taak voltooid" : "Markeer als voltooid"}
          >
            {(isCompleted || completing) && <Check className="w-3 h-3 text-white" />}
          </button>
          <CompletionEffect
            effect={task.list?.effect ?? "none"}
            show={showEffect}
            onDismiss={() => { setShowEffect(false); onCompleted(task.id); }}
          />
        </div>

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

            {/* Assignee / claim */}
            {task.openForClaim && !isCompleted ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="shrink-0 ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                title="Pak deze taak"
              >
                <UserPlus className="w-3 h-3" />
                {claiming ? "..." : "Pak 'm"}
              </button>
            ) : task.assignee ? (
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
            ) : null}
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

            {/* Subtasks progress */}
            {task.subtasks.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <ListChecks className="w-3 h-3" />
                {task.subtasks.filter((s) => s.completedAt).length}/{task.subtasks.length}
              </span>
            )}

            {/* Points badge (task override) */}
            {task.points != null && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-indigo-500 dark:text-indigo-400">
                ⭐{task.points}
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

      <Dialog.Root open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm bg-white dark:bg-gray-900 md:rounded-2xl rounded-t-2xl shadow-2xl border border-[var(--border)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
                Herhalende taak voltooien
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <div className="p-5 space-y-3">
              <button
                type="button"
                onClick={() => doComplete(false)}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors text-left"
              >
                <RefreshCw className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Alleen deze keer</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Volgende herhaling wordt automatisch ingepland</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => doComplete(true)}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
              >
                <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Permanent voltooien</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Taak stopt — er wordt geen nieuwe herhaling aangemaakt</p>
                </div>
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

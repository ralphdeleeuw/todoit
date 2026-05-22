"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2 } from "lucide-react";
import { TaskForm, type TaskFormData } from "./TaskForm";
import { SubtaskList } from "./SubtaskList";
import { RecurrenceHistory } from "./RecurrenceHistory";
import type { TaskWithRelations, SubtaskSummary } from "@/types";
import { format } from "date-fns";

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

interface TaskDetailSheetProps {
  task: TaskWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: FamilyMember[];
  lists: TaskList[];
  labels: TaskLabel[];
  isParent: boolean;
  currentUserId: string;
  onUpdated: (task: TaskWithRelations) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  members,
  lists,
  labels,
  isParent,
  currentUserId,
  onUpdated,
  onDeleted,
}: TaskDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<SubtaskSummary[]>(task.subtasks);
  const [history, setHistory] = useState<Array<{ id: string; completedAt: string }>>([]);

  useEffect(() => {
    if (!open || !task.isRecurring) return;
    fetch(`/api/tasks/${task.id}/history`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setHistory(data))
      .catch(() => {});
  }, [open, task.id, task.isRecurring]);

  const initialData: TaskFormData = {
    title: task.title,
    description: task.description ?? "",
    dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
    reminderAt: task.reminderAt ? format(new Date(task.reminderAt), "yyyy-MM-dd'T'HH:mm") : "",
    assigneeId: task.assigneeId ?? currentUserId,
    openForClaim: task.openForClaim,
    listId: task.listId ?? "__none__",
    labelIds: task.labels.map((l) => l.label.id),
    isRecurring: task.isRecurring,
    recurrenceInterval: task.recurrenceInterval ?? 7,
    points: task.points ?? null,
  };

  async function handleSubmit(data: TaskFormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          dueDate: data.dueDate || null,
          reminderAt: data.reminderAt || null,
          assigneeId: data.openForClaim ? null : (data.assigneeId || null),
          openForClaim: data.openForClaim,
          listId: data.listId || null,
          labelIds: data.labelIds,
          isRecurring: data.isRecurring,
          recurrenceInterval: data.isRecurring ? data.recurrenceInterval : null,
          points: data.points,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Er ging iets mis");
      }
      const updated = await res.json();
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Weet je zeker dat je deze taak wilt verwijderen?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Verwijderen mislukt");
      onDeleted(task.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verwijderen mislukt");
      setDeleting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-gray-900 md:rounded-2xl rounded-t-2xl shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-white dark:bg-gray-900">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
              Taak bewerken
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {(isParent || task.createdById === currentUserId) && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Verwijder taak"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
          </div>

          <div className="p-5">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <TaskForm
              initialData={initialData}
              members={members}
              lists={lists}
              labels={labels}
              isParent={isParent}
              currentUserId={currentUserId}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              submitLabel="Wijzigingen opslaan"
              loading={loading}
              effectivePoints={task.list?.points ?? undefined}
            />
            <div className="mt-2 border-t border-[var(--border)] pt-4">
              <SubtaskList
                parentTaskId={task.id}
                subtasks={subtasks}
                onSubtasksChanged={setSubtasks}
              />
            </div>

            {task.isRecurring && (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <RecurrenceHistory history={history} />
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


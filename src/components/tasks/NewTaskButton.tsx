"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { TaskForm, type TaskFormData } from "./TaskForm";
import type { TaskWithRelations } from "@/types";

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

interface NewTaskButtonProps {
  members: FamilyMember[];
  lists: TaskList[];
  labels: TaskLabel[];
  isParent: boolean;
  currentUserId: string;
  defaultListId?: string;
  onCreated: (task: TaskWithRelations) => void;
  variant?: "fab" | "button" | "controlled";
  /** When variant="controlled", pass open state from parent */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewTaskButton({
  members,
  lists,
  labels,
  isParent,
  currentUserId,
  defaultListId,
  onCreated,
  variant = "button",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: NewTaskButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = variant === "controlled";
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? setInternalOpen)
    : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: TaskFormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          dueDate: data.dueDate || null,
          reminderAt: data.reminderAt || null,
          assigneeId: data.assigneeId || null,
          listId: data.listId || defaultListId || null,
          labelIds: data.labelIds,
          isRecurring: data.isRecurring,
          recurrenceInterval: data.isRecurring ? data.recurrenceInterval : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Er ging iets mis");
      }
      const created = await res.json();
      onCreated(created);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <Dialog.Trigger asChild>
          {variant === "fab" ? (
            <button
              type="button"
              className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
              aria-label="Nieuwe taak"
            >
              <Plus className="w-6 h-6" />
            </button>
          ) : (
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm hover:shadow">
              <Plus className="w-4 h-4" />
              Nieuwe taak
            </button>
          )}
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-gray-900 md:rounded-2xl rounded-t-2xl shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-white dark:bg-gray-900">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
              Nieuwe taak
            </Dialog.Title>
            <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <div className="p-5">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <TaskForm
              initialData={{ listId: defaultListId }}
              members={members}
              lists={lists}
              labels={labels}
              isParent={isParent}
              currentUserId={currentUserId}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
              submitLabel="Taak aanmaken"
              loading={loading}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

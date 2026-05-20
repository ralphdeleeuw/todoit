"use client";

import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

interface AddExistingTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  allTasks: TaskWithRelations[];
  onAdded: (tasks: TaskWithRelations[]) => void;
}

export function AddExistingTaskDialog({
  open,
  onOpenChange,
  listId,
  allTasks,
  onAdded,
}: AddExistingTaskDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(
    () => allTasks.filter((t) => t.listId !== listId && !t.completedAt),
    [allTasks, listId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((t) => t.title.toLowerCase().includes(q));
  }, [candidates, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    setSearch("");
    setSelected(new Set());
    setError(null);
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        Array.from(selected).map((taskId) =>
          fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listId }),
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error ?? "Er ging iets mis");
            }
            return res.json() as Promise<TaskWithRelations>;
          })
        )
      );
      onAdded(results);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-gray-900 md:rounded-2xl rounded-t-2xl shadow-2xl border border-[var(--border)] max-h-[85vh] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
              Bestaande taak toevoegen
            </Dialog.Title>
            <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="px-5 pt-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek taken..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
            {candidates.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                Geen andere taken beschikbaar
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                Geen taken gevonden
              </p>
            ) : (
              <ul className="space-y-1.5">
                {filtered.map((task) => {
                  const isSelected = selected.has(task.id);
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => toggle(task.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                          isSelected
                            ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                            : "border-[var(--border)] bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300 dark:border-gray-600"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                          </p>
                          {task.list && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: task.list.color ?? "#6366f1" }}
                              />
                              {task.list.name}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {error && (
            <div className="px-5 shrink-0">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          <div className="px-5 py-4 border-t border-[var(--border)] shrink-0 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)] text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selected.size === 0 || loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {loading
                ? "Bezig..."
                : selected.size === 0
                ? "Voeg toe"
                : `Voeg ${selected.size} ${selected.size === 1 ? "taak" : "taken"} toe`}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

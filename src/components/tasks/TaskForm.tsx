"use client";

import { useState } from "react";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
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

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
  listId: string;
  labelIds: string[];
  isRecurring: boolean;
  recurrenceInterval: number;
}

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  members: FamilyMember[];
  lists: TaskList[];
  labels: TaskLabel[];
  isParent: boolean;
  currentUserId: string;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export function TaskForm({
  initialData,
  members,
  lists,
  labels,
  isParent,
  currentUserId,
  onSubmit,
  onCancel,
  submitLabel = "Opslaan",
  loading = false,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId ?? currentUserId);
  const [listId, setListId] = useState(initialData?.listId ?? "");
  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialData?.labelIds ?? []);
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    initialData?.recurrenceInterval ?? 7
  );

  function toggleLabel(id: string) {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      assigneeId,
      listId,
      labelIds: selectedLabels,
      isRecurring,
      recurrenceInterval,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label.Root
          htmlFor="task-title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Titel <span className="text-red-500">*</span>
        </Label.Root>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Taaknaam..."
          required
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
        />
      </div>

      <div>
        <Label.Root
          htmlFor="task-description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Beschrijving
        </Label.Root>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optionele beschrijving..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label.Root
            htmlFor="task-due-date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Vervaldatum
          </Label.Root>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
          />
        </div>

        {isParent && members.length > 0 && (
          <div>
            <Label.Root className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Toewijzen aan
            </Label.Root>
            <Select.Root value={assigneeId} onValueChange={setAssigneeId}>
              <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 overflow-hidden rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 shadow-lg">
                  <Select.Viewport className="p-1">
                    {members.map((m) => (
                      <Select.Item
                        key={m.id}
                        value={m.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 outline-none data-[highlighted]:bg-indigo-50 dark:data-[highlighted]:bg-indigo-950/50"
                      >
                        <Select.ItemText>{m.name ?? "Naamloos"}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        )}
      </div>

      {lists.length > 0 && (
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Lijst
          </Label.Root>
          <Select.Root value={listId} onValueChange={setListId}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <Select.Value placeholder="Geen lijst" />
              <Select.Icon>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 overflow-hidden rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 shadow-lg">
                <Select.Viewport className="p-1">
                  <Select.Item
                    value=""
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 outline-none data-[highlighted]:bg-gray-50 dark:data-[highlighted]:bg-gray-700"
                  >
                    <Select.ItemText>Geen lijst</Select.ItemText>
                  </Select.Item>
                  {lists.map((l) => (
                    <Select.Item
                      key={l.id}
                      value={l.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 outline-none data-[highlighted]:bg-indigo-50 dark:data-[highlighted]:bg-indigo-950/50"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: l.color ?? "#6366f1" }}
                      />
                      <Select.ItemText>{l.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      )}

      {labels.length > 0 && (
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Labels
          </Label.Root>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => {
              const selected = selectedLabels.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                    selected
                      ? "text-white border-transparent"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-[var(--border)]"
                  )}
                  style={selected ? { backgroundColor: label.color, borderColor: label.color } : {}}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <div
              className={cn(
                "w-10 h-6 rounded-full transition-colors",
                isRecurring ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
            <div
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                isRecurring ? "translate-x-4" : "translate-x-0"
              )}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Herhalende taak
            </span>
          </div>
        </label>

        {isRecurring && (
          <div className="mt-3 flex items-center gap-2 pl-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Herhaal elke</span>
            <input
              type="number"
              min={1}
              max={365}
              value={recurrenceInterval}
              onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
              className="w-16 px-2 py-1 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">dag(en)</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)] text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading ? "Bezig..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

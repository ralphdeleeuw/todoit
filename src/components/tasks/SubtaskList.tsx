"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubtaskSummary } from "@/types";

interface SubtaskListProps {
  parentTaskId: string;
  subtasks: SubtaskSummary[];
  onSubtasksChanged: (subtasks: SubtaskSummary[]) => void;
}

export function SubtaskList({ parentTaskId, subtasks, onSubtasksChanged }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtaskParentId: parentTaskId }),
      });
      if (res.ok) {
        const created = await res.json();
        onSubtasksChanged([...subtasks, { id: created.id, title: created.title, completedAt: created.completedAt }]);
        setNewTitle("");
        setShowInput(false);
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(subtask: SubtaskSummary) {
    if (subtask.completedAt) return;
    const res = await fetch(`/api/tasks/${subtask.id}/complete`, { method: "POST" });
    if (res.ok) {
      onSubtasksChanged(
        subtasks.map((s) =>
          s.id === subtask.id ? { ...s, completedAt: new Date() } : s
        )
      );
    }
  }

  async function handleDelete(subtaskId: string) {
    const res = await fetch(`/api/tasks/${subtaskId}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      onSubtasksChanged(subtasks.filter((s) => s.id !== subtaskId));
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Subtaken
          {subtasks.length > 0 && (
            <span className="ml-1.5 text-gray-400">
              {subtasks.filter((s) => s.completedAt).length}/{subtasks.length}
            </span>
          )}
        </span>
        <button
          onClick={() => setShowInput((v) => !v)}
          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          <Plus className="w-3 h-3" />
          Toevoegen
        </button>
      </div>

      {subtasks.length > 0 && (
        <ul className="space-y-1 mb-2">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center gap-2 group"
            >
              <button
                disabled={!!subtask.completedAt}
                onClick={() => handleToggle(subtask)}
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  subtask.completedAt
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-gray-300 dark:border-gray-600 hover:border-indigo-500"
                )}
              >
                {subtask.completedAt && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  subtask.completedAt
                    ? "line-through text-gray-400 dark:text-gray-500"
                    : "text-gray-800 dark:text-gray-200"
                )}
              >
                {subtask.title}
              </span>
              {!subtask.completedAt && (
                <button
                  onClick={() => handleDelete(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showInput && (
        <div className="flex items-center gap-2 mt-1">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setShowInput(false); setNewTitle(""); }
            }}
            placeholder="Subtaak toevoegen…"
            className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newTitle.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700"
          >
            {adding ? "…" : "Voeg toe"}
          </button>
        </div>
      )}
    </div>
  );
}

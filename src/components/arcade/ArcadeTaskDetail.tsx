"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listColor } from "@/lib/arcade";
import type { TaskWithRelations, SubtaskSummary } from "@/types";

interface Member { id: string; name: string | null; image: string | null; }

interface ArcadeTaskDetailProps {
  task: TaskWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  isParent: boolean;
  currentUserId: string;
  onUpdated: (task: TaskWithRelations) => void;
  onDeleted: (taskId: string) => void;
  onCompleted: (taskId: string) => void;
}

const PILL_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

export function ArcadeTaskDetail({
  task, open, onOpenChange, members, isParent, currentUserId, onUpdated, onDeleted, onCompleted,
}: ArcadeTaskDetailProps) {
  const [subtasks, setSubtasks] = useState<SubtaskSummary[]>(task.subtasks);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(task.assigneeId ?? null);
  const [reassigning, setReassigning] = useState(false);
  const [currentList, setCurrentList] = useState(task.list);
  const [removingFromList, setRemovingFromList] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  const color = listColor(currentList?.color);
  const dueStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
    : null;
  const assignee = members.find((m) => m.id === assigneeId);

  async function handleRemoveFromList() {
    if (removingFromList) return;
    setRemovingFromList(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentList(null);
        onUpdated(updated);
      }
    } finally {
      setRemovingFromList(false);
    }
  }
  async function handleSaveTitle(newTitle: string) {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === task.title || savingTitle) { setEditingTitle(false); setTitle(task.title); return; }
    setSavingTitle(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTitle(updated.title);
        onUpdated(updated);
      } else {
        setTitle(task.title);
      }
    } finally {
      setSavingTitle(false);
      setEditingTitle(false);
    }
  }

  const assigneeInitial = (assignee?.name ?? "?")[0].toUpperCase();
  const assigneeColor = PILL_COLORS[members.findIndex((m) => m.id === assigneeId) % PILL_COLORS.length] ?? "#6366f1";

  async function handleReassign(newAssigneeId: string) {
    if (newAssigneeId === assigneeId || reassigning) return;
    setReassigning(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newAssigneeId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAssigneeId(newAssigneeId);
        onUpdated(updated);
      }
    } finally {
      setReassigning(false);
    }
  }

  const doneSubs = subtasks.filter((s) => s.completedAt).length;
  const subPct = subtasks.length > 0 ? Math.round((doneSubs / subtasks.length) * 100) : 0;

  const canDelete = isParent || task.createdById === currentUserId;

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
      if (res.ok) {
        onCompleted(task.id);
        onOpenChange(false);
      }
    } finally {
      setCompleting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Taak verwijderen?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onDeleted(task.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleSubtask(sub: SubtaskSummary) {
    const completed = !sub.completedAt;
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === sub.id ? { ...s, completedAt: completed ? new Date() : null } : s
      )
    );
    await fetch(`/api/tasks/${sub.id}/complete`, {
      method: completed ? "POST" : "DELETE",
    });
  }

  async function addSubtask() {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtask.trim(),
          subtaskParentId: task.id,
          familyId: task.familyId,
          assigneeId: task.assigneeId,
          listId: task.listId,
          labelIds: [],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSubtasks((prev) => [...prev, { id: created.id, title: created.title, completedAt: null }]);
        setNewSubtask("");
      }
    } finally {
      setAddingSubtask(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed z-50 inset-x-0 bottom-0 overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          style={{
            maxHeight: "92vh",
            borderRadius: "20px 20px 0 0",
            background: "var(--arc-panel)",
            border: "1px solid var(--arc-border-str)",
          }}
        >
          {/* Handle + close */}
          <div className="flex justify-between items-center px-4 pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <div />
            <Dialog.Close className="p-1.5 rounded-xl text-[var(--arc-muted)] hover:text-white transition-colors ml-auto">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Hero card */}
          <div
            className="mx-4 mb-4 rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${color}22 0%, var(--arc-panel-2) 100%)`,
              border: `1px solid ${color}44`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${color}22`, border: `1px solid ${color}44` }}
              >
                {title.match(/^\p{Emoji}/u)?.[0] ?? "📋"}
              </div>
              <div className="flex-1 min-w-0">
                {editingTitle ? (
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={(e) => handleSaveTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleSaveTitle(title); }
                      if (e.key === "Escape") { setEditingTitle(false); setTitle(task.title); }
                    }}
                    disabled={savingTitle}
                    className="w-full bg-transparent font-bold text-white text-base leading-tight border-b border-white/30 outline-none pb-0.5"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="text-left font-bold text-white text-base leading-tight w-full hover:opacity-80 transition-opacity"
                  >
                    {title.replace(/^\p{Emoji}\s*/u, "")}
                  </button>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {currentList && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
                      {currentList.name}
                      <button
                        type="button"
                        onClick={handleRemoveFromList}
                        disabled={removingFromList}
                        className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                        title="Verwijder uit lijst"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {dueStr && (
                    <span className="text-[10px] text-[var(--arc-muted)]">📅 {dueStr}</span>
                  )}
                  {task.isRecurring && (
                    <span className="text-[10px] text-[var(--arc-muted)]">↻ elke {task.recurrenceInterval}d</span>
                  )}
                </div>
              </div>
              {(currentList?.points ?? 0) > 0 && (
                <span className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: "#facc1522", color: "#facc15" }}>
                  💎 {currentList!.points}
                </span>
              )}
            </div>

            {/* Assignee */}
            <div
              className="mt-3 pt-3"
              style={{ borderTop: "1px solid var(--arc-border)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                  style={{ background: assigneeColor }}
                >
                  {assignee?.image
                    ? <img src={assignee.image} alt="" className="w-full h-full object-cover rounded-full" />
                    : assigneeInitial
                  }
                </div>
                <span className="text-xs text-[var(--arc-muted)]">
                  <span className="text-white font-medium">{assignee?.name ?? "Iemand"}</span> doet deze taak
                </span>
                {reassigning && <span className="text-[10px] text-[var(--arc-muted)] ml-auto">opslaan…</span>}
              </div>
              {isParent && members.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {members.map((m, i) => {
                    const mColor = PILL_COLORS[i % PILL_COLORS.length];
                    const mInitial = (m.name ?? "?")[0].toUpperCase();
                    const isActive = m.id === assigneeId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleReassign(m.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-medium transition-all active:scale-95"
                        style={isActive
                          ? { background: `${mColor}33`, border: `1.5px solid ${mColor}`, color: "white" }
                          : { background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)", color: "var(--arc-muted)" }
                        }
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0" style={{ background: mColor }}>
                          {m.image ? <img src={m.image} alt="" className="w-full h-full object-cover rounded-full" /> : mInitial}
                        </div>
                        {m.name?.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pb-4 space-y-4">
            {error && <p className="text-xs text-rose-400">{error}</p>}

            {/* Subtasks */}
            {(subtasks.length > 0 || true) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)]">
                    Subtaken
                  </p>
                  {subtasks.length > 0 && (
                    <span className="text-[10px] text-[var(--arc-muted)] tabular-nums">
                      {doneSubs}/{subtasks.length}
                    </span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="mb-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--arc-panel-2)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${subPct}%`, background: "linear-gradient(to right, var(--xp-accent), var(--gold))" }}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  {subtasks.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubtask(sub)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-opacity"
                      style={{ background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)" }}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          sub.completedAt ? "border-[var(--xp-accent)]" : "border-white/20"
                        )}
                        style={sub.completedAt ? { background: "var(--xp-accent)" } : {}}
                      >
                        {sub.completedAt && <Check className="w-3 h-3 text-[var(--arc-bg)]" strokeWidth={3} />}
                      </div>
                      <span
                        className={cn(
                          "text-sm flex-1",
                          sub.completedAt ? "line-through text-[var(--arc-muted-deep)]" : "text-white"
                        )}
                      >
                        {sub.title}
                      </span>
                    </button>
                  ))}

                  {/* Add subtask */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ border: "1.5px dashed var(--arc-border-str)" }}
                  >
                    <Plus className="w-4 h-4 text-[var(--arc-muted)] shrink-0" />
                    <input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); }}}
                      placeholder="+ Subtaak toevoegen"
                      className="flex-1 bg-transparent text-sm text-white placeholder-[var(--arc-muted)] outline-none"
                    />
                    {newSubtask && (
                      <button type="button" onClick={addSubtask} disabled={addingSubtask} className="text-[var(--xp-accent)] text-xs font-semibold">
                        {addingSubtask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="sticky bottom-0 px-4 pb-8 pt-3 flex gap-2"
            style={{ background: "var(--arc-panel)", borderTop: "1px solid var(--arc-border)" }}
          >
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))",
                boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
              }}
            >
              {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" strokeWidth={3} /> Voltooi taak</>}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors disabled:opacity-50"
                style={{ background: "#f43f5e22", border: "1px solid #f43f5e44", color: "#f43f5e" }}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

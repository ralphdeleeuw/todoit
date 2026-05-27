"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

const EMOJIS = ["📋", "🧹", "🔧", "📚", "🏕️", "✨", "🛒", "🍳", "🌿", "💪", "🎯", "⭐"];

interface Member { id: string; name: string | null; image: string | null; }
interface ListItem { id: string; name: string; color: string | null; points?: number; }

interface ArcadeNewTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  lists: ListItem[];
  currentUserId: string;
  onCreated: (task: TaskWithRelations) => void;
}

function dueDateFromWhen(when: string): string | null {
  const d = new Date();
  if (when === "today") return d.toISOString();
  if (when === "tomorrow") { d.setDate(d.getDate() + 1); return d.toISOString(); }
  if (when === "week") { d.setDate(d.getDate() + 3); return d.toISOString(); }
  if (when === "nextweek") { d.setDate(d.getDate() + 7); return d.toISOString(); }
  return null;
}

const PILL_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

const WHEN_OPTIONS = [
  { key: "today",    label: "⚡ Vandaag" },
  { key: "tomorrow", label: "🌅 Morgen" },
  { key: "week",     label: "📆 Komende week" },
  { key: "nextweek", label: "🗓️ Volgende week" },
];

const RECUR_OPTIONS = [
  { key: "",   label: "Eenmalig" },
  { key: "1",  label: "Elke dag" },
  { key: "7",  label: "Wekelijks" },
  { key: "14", label: "2 weken" },
  { key: "5",  label: "Elke 5 dgn" },
];

export function ArcadeNewTaskSheet({
  open, onOpenChange, members, lists, currentUserId, onCreated,
}: ArcadeNewTaskSheetProps) {
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("today");
  const [assigneeId, setAssigneeId] = useState<string>(currentUserId);
  const [listId, setListId] = useState<string>(lists[0]?.id ?? "");
  const [recur, setRecur] = useState("");
  const [customPoints, setCustomPoints] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedList = lists.find((l) => l.id === listId);
  const listPoints = selectedList?.points ?? 0;
  const pointsPreview = customPoints !== "" ? Number(customPoints) : listPoints;

  const OPEN_ID = "__open__";

  function reset() {
    setTitle(""); setWhen("today"); setAssigneeId(currentUserId);
    setListId(lists[0]?.id ?? ""); setRecur(""); setEmojiIdx(0); setError(null); setCustomPoints("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${EMOJIS[emojiIdx]} ${title.trim()}`,
          dueDate: dueDateFromWhen(when),
          assigneeId: assigneeId === OPEN_ID ? null : (assigneeId || null),
          openForClaim: assigneeId === OPEN_ID,
          listId: listId || null,
          isRecurring: recur !== "",
          recurrenceInterval: recur ? parseInt(recur) : null,
          labelIds: [],
          points: customPoints !== "" ? Number(customPoints) : null,
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error ?? "Mislukt"); }
      const created = await res.json();
      onCreated(created);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed z-50 inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          style={{ borderRadius: "20px 20px 0 0", background: "var(--arc-panel)", border: "1px solid var(--arc-border-str)" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-5">
            {/* Title row */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmojiIdx((i) => (i + 1) % EMOJIS.length)}
                className="w-11 h-11 rounded-2xl text-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--arc-panel-2)", border: "1px solid var(--arc-border-str)" }}
              >
                {EMOJIS[emojiIdx]}
              </button>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Wat moet er gebeuren?"
                className="flex-1 bg-transparent text-white text-base font-medium placeholder-[var(--arc-muted)] outline-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 px-1">{error}</p>
            )}

            {/* Lijst */}
            {lists.length > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">Lijst</p>
                <div className="grid grid-cols-2 gap-2">
                  {lists.map((l) => {
                    const active = listId === l.id;
                    const color = l.color ?? "#6366f1";
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setListId(l.id)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all text-left"
                        style={
                          active
                            ? { background: `${color}22`, border: `1.5px solid ${color}`, color: "white" }
                            : { background: "var(--arc-panel-2)", border: "1.5px solid var(--arc-border)", color: "var(--arc-muted)" }
                        }
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wanneer */}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">Wanneer</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {WHEN_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setWhen(o.key)}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      when === o.key ? "text-white" : "text-[var(--arc-muted)]"
                    )}
                    style={
                      when === o.key
                        ? { background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))", boxShadow: "0 2px 10px rgba(124,58,237,0.4)" }
                        : { background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)" }
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voor wie */}
            {members.length > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">Voor wie</p>
                <div className="grid grid-cols-4 gap-2">
                  {/* Wie pakt deze? */}
                  <button
                    type="button"
                    onClick={() => setAssigneeId(OPEN_ID)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                    style={
                      assigneeId === OPEN_ID
                        ? { background: "#f59e0b22", border: "1.5px solid #f59e0b", boxShadow: "0 0 8px #f59e0b44", color: "white" }
                        : { background: "var(--arc-panel-2)", border: "1.5px solid var(--arc-border)", color: "var(--arc-muted)" }
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
                      style={{ background: "#f59e0b22", border: "1.5px solid #f59e0b44", fontSize: 18 }}
                    >
                      🙋
                    </div>
                    <span className="truncate w-full text-center px-1 leading-tight">Wie pakt?</span>
                  </button>

                  {members.map((m, i) => {
                    const color = PILL_COLORS[i % PILL_COLORS.length];
                    const active = assigneeId === m.id;
                    const initial = (m.name ?? "?")[0].toUpperCase();
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setAssigneeId(m.id)}
                        className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                        style={
                          active
                            ? { background: `${color}22`, border: `1.5px solid ${color}`, boxShadow: `0 0 8px ${color}44`, color: "white" }
                            : { background: "var(--arc-panel-2)", border: "1.5px solid var(--arc-border)", color: "var(--arc-muted)" }
                        }
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden"
                          style={{ background: color }}
                        >
                          {m.image
                            ? <img src={m.image} alt="" className="w-full h-full object-cover rounded-full" />
                            : initial
                          }
                        </div>
                        <span className="truncate w-full text-center px-1">{m.name?.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Herhaling */}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">Herhaling</p>
              <div className="flex gap-2 flex-wrap">
                {RECUR_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setRecur(o.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      recur === o.key ? "text-white" : "text-[var(--arc-muted)]"
                    )}
                    style={
                      recur === o.key
                        ? { background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))" }
                        : { background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)" }
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* XP punten */}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">XP-punten</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  placeholder={String(listPoints)}
                  className="w-24 px-3 py-2 rounded-xl text-white text-sm text-center font-semibold outline-none"
                  style={{ background: "var(--arc-panel-2)", border: "1.5px solid var(--arc-border-str)" }}
                />
                <span className="text-xs text-[var(--arc-muted)]">
                  {customPoints !== "" ? "aangepast" : `standaard van lijst`}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[.98]"
              style={{
                background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))",
                boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
              }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Aanmaken · <span style={{ color: "var(--gold)" }}>+{pointsPreview} XP bij voltooien</span></>
              }
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

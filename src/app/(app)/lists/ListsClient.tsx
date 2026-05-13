"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Lock, Users, Globe, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type Visibility = "PRIVATE" | "FAMILY" | "SHARED";

interface ListItem {
  id: string;
  name: string;
  color: string | null;
  points: number;
  visibility: Visibility;
  ownerId: string | null;
  memberIds: string[];
  taskCount: number;
}

interface Member {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Props {
  lists: ListItem[];
  members: Member[];
  currentUserId: string;
  isParent: boolean;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#64748b",
];

const LIST_EMOJIS: Record<string, string> = {
  huishouden: "🧹", school: "📚", kamperen: "🏕️", klusjes: "🔧",
  boodschappen: "🛒", sport: "💪", werk: "💼", planning: "📅",
};

function listEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(LIST_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "📋";
}

interface FormState {
  name: string;
  color: string;
  points: number;
  visibility: Visibility;
  memberIds: string[];
}

function ListForm({
  initial, members, currentUserId, onSave, onCancel, saving,
}: {
  initial: FormState;
  members: Member[];
  currentUserId: string;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color || COLORS[0]);
  const [points, setPoints] = useState(initial.points);
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [memberIds, setMemberIds] = useState<string[]>(initial.memberIds);
  const otherMembers = members.filter((m) => m.id !== currentUserId);

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, points, visibility, memberIds });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Lijstnaam..."
        required
        className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-[var(--arc-muted)] outline-none"
        style={{ background: "var(--arc-panel-2)", border: "1px solid var(--arc-border-str)" }}
      />

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">Kleur</p>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
              style={{ backgroundColor: c, borderColor: color === c ? "#fff" : c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}>
              {color === c && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">Punten per voltooide taak</p>
        <div className="flex items-center gap-2">
          {[0, 5, 10, 15, 25, 50].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPoints(p)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", points === p ? "text-white" : "text-[var(--arc-muted)]")}
              style={points === p
                ? { background: "#facc1533", border: "1.5px solid #facc15", color: "#facc15" }
                : { background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)" }
              }
            >
              💎 {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">Zichtbaarheid</p>
        <div className="flex gap-2 flex-wrap">
          {(["PRIVATE", "FAMILY", "SHARED"] as Visibility[]).map((v) => (
            <button key={v} type="button" onClick={() => setVisibility(v)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                visibility === v ? "text-white" : "text-[var(--arc-muted)]")}
              style={visibility === v
                ? { background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))" }
                : { background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)" }}>
              {v === "PRIVATE" && <Lock className="w-3.5 h-3.5" />}
              {v === "FAMILY" && <Globe className="w-3.5 h-3.5" />}
              {v === "SHARED" && <Users className="w-3.5 h-3.5" />}
              {v === "PRIVATE" ? "Privé" : v === "FAMILY" ? "Gezin" : "Gedeeld"}
            </button>
          ))}
        </div>
      </div>

      {visibility === "SHARED" && otherMembers.length > 0 && (
        <div className="space-y-1.5">
          {otherMembers.map((m) => (
            <label key={m.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer"
              style={{ background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)" }}>
              <input type="checkbox" checked={memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} className="w-4 h-4 accent-indigo-500" />
              <span className="text-sm text-white">{m.name ?? "Naamloos"}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-2xl text-sm text-[var(--arc-muted)] transition-colors"
          style={{ background: "var(--arc-panel-2)", border: "1px solid var(--arc-border)" }}>
          Annuleren
        </button>
        <button type="submit" disabled={saving || !name.trim()}
          className="flex-1 py-2.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opslaan"}
        </button>
      </div>
    </form>
  );
}

export default function ListsClient({ lists: initialLists, members, currentUserId, isParent }: Props) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [formOpen, setFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(data: FormState) {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, color: data.color, points: data.points, visibility: data.visibility, memberIds: data.memberIds }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Mislukt"); return; }
      const newList = await res.json();
      setLists((prev) => [...prev, {
        id: newList.id, name: newList.name, color: newList.color,
        points: newList.points ?? 10,
        visibility: newList.visibility, ownerId: newList.ownerId,
        memberIds: (newList.members ?? []).map((m: { userId: string }) => m.userId),
        taskCount: 0,
      }]);
      setFormOpen(false);
      router.refresh();
    } finally { setSaving(false); }
  }

  async function handleEdit(listId: string, data: FormState) {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, color: data.color, points: data.points, visibility: data.visibility, memberIds: data.memberIds }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Mislukt"); return; }
      const updated = await res.json();
      setLists((prev) => prev.map((l) => l.id === listId ? {
        ...l, name: updated.name, color: updated.color, points: updated.points ?? l.points, visibility: updated.visibility,
        memberIds: (updated.members ?? []).map((m: { userId: string }) => m.userId),
      } : l));
      setEditingList(null);
      router.refresh();
    } finally { setSaving(false); }
  }

  async function handleDelete(listId: string) {
    setDeletingId(listId); setError(null);
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Mislukt"); return; }
      setLists((prev) => prev.filter((l) => l.id !== listId));
      router.refresh();
    } finally { setDeletingId(null); }
  }

  function canManage(list: ListItem) {
    return list.ownerId === currentUserId || isParent;
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--arc-muted)] uppercase">TODOIT</p>
          <h1 className="text-xl font-black text-white tracking-tight">Lijsten</h1>
        </div>
        <button
          type="button"
          onClick={() => { setEditingList(null); setFormOpen(true); setError(null); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))" }}
        >
          <Plus className="w-4 h-4" />
          Nieuwe lijst
        </button>
      </header>

      {error && <p className="mx-4 mb-3 text-xs text-rose-400">{error}</p>}

      {lists.length === 0 ? (
        <div className="mx-4 mt-8 p-8 rounded-2xl flex flex-col items-center gap-2 text-center"
          style={{ border: "1.5px dashed var(--arc-border-str)", background: "var(--arc-panel)" }}>
          <span className="text-3xl">📋</span>
          <p className="text-white font-semibold">Nog geen lijsten</p>
          <p className="text-[var(--arc-muted)] text-xs">Maak je eerste lijst aan!</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {lists.map((list) => {
            const color = list.color ?? "#6366f1";
            const emoji = listEmoji(list.name);
            return (
              <div key={list.id} className="relative group">
                <Link
                  href={`/list/${list.id}`}
                  className="flex flex-col p-4 rounded-2xl transition-all active:scale-[.97]"
                  style={{
                    background: `linear-gradient(135deg, ${color}22, var(--arc-panel-2))`,
                    border: `1.5px solid ${color}44`,
                    minHeight: 120,
                  }}
                >
                  <span className="text-3xl mb-2">{emoji}</span>
                  <p className="font-bold text-white text-sm leading-tight truncate">{list.name}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--arc-muted)" }}>
                    {list.taskCount} {list.taskCount === 1 ? "taak" : "taken"}
                  </p>
                  {list.points > 0 && (
                    <p className="text-[10px] font-bold mt-0.5 tabular-nums" style={{ color: "#facc15" }}>
                      💎 {list.points} XP
                    </p>
                  )}
                </Link>
                {canManage(list) && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setEditingList(list); setFormOpen(false); setError(null); }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--arc-muted)] hover:text-white transition-colors"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleDelete(list.id); }}
                      disabled={deletingId === list.id}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                      {deletingId === list.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />
                      }
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog.Root open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setError(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed z-50 inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            style={{ borderRadius: "20px 20px 0 0", background: "var(--arc-panel)", border: "1px solid var(--arc-border-str)" }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <Dialog.Title className="text-base font-bold text-white">Nieuwe lijst</Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-xl text-[var(--arc-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <div className="px-4 pb-8">
              <ListForm
                initial={{ name: "", color: COLORS[0], points: 10, visibility: "FAMILY", memberIds: [] }}
                members={members}
                currentUserId={currentUserId}
                onSave={handleCreate}
                onCancel={() => setFormOpen(false)}
                saving={saving}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit dialog */}
      <Dialog.Root open={!!editingList} onOpenChange={(v) => { if (!v) { setEditingList(null); setError(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed z-50 inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            style={{ borderRadius: "20px 20px 0 0", background: "var(--arc-panel)", border: "1px solid var(--arc-border-str)" }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <Dialog.Title className="text-base font-bold text-white">Lijst bewerken</Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-xl text-[var(--arc-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            {editingList && (
              <div className="px-4 pb-8">
                <ListForm
                  initial={{ name: editingList.name, color: editingList.color ?? COLORS[0], points: editingList.points, visibility: editingList.visibility, memberIds: editingList.memberIds }}
                  members={members}
                  currentUserId={currentUserId}
                  onSave={(data) => handleEdit(editingList.id, data)}
                  onCancel={() => setEditingList(null)}
                  saving={saving}
                />
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}

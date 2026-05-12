"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Lock, Users, Globe, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Visibility = "PRIVATE" | "FAMILY" | "SHARED";

interface ListItem {
  id: string;
  name: string;
  color: string | null;
  visibility: Visibility;
  ownerId: string | null;
  memberIds: string[];
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

const visibilityLabel: Record<Visibility, string> = {
  PRIVATE: "Privé",
  FAMILY: "Heel gezin",
  SHARED: "Gedeeld",
};

const visibilityIcon: Record<Visibility, React.ReactNode> = {
  PRIVATE: <Lock className="w-3.5 h-3.5" />,
  FAMILY: <Globe className="w-3.5 h-3.5" />,
  SHARED: <Users className="w-3.5 h-3.5" />,
};

interface FormState {
  name: string;
  color: string;
  visibility: Visibility;
  memberIds: string[];
}

function ListForm({
  initial,
  members,
  currentUserId,
  onSave,
  onCancel,
  saving,
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
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [memberIds, setMemberIds] = useState<string[]>(initial.memberIds);

  const otherMembers = members.filter((m) => m.id !== currentUserId);

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, visibility, memberIds });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Naam
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lijstnaam..."
          required
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Kleur
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#fff" : c,
                boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
              }}
            >
              {color === c && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Zichtbaarheid
        </label>
        <div className="flex gap-2">
          {(["PRIVATE", "FAMILY", "SHARED"] as Visibility[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                visibility === v
                  ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                  : "border-[var(--border)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {visibilityIcon[v]}
              {visibilityLabel[v]}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          {visibility === "PRIVATE" && "Alleen jij kunt deze lijst zien."}
          {visibility === "FAMILY" && "Alle gezinsleden kunnen deze lijst zien."}
          {visibility === "SHARED" && "Kies welke gezinsleden deze lijst mogen zien."}
        </p>
      </div>

      {visibility === "SHARED" && otherMembers.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Gedeeld met
          </label>
          <div className="space-y-1">
            {otherMembers.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={memberIds.includes(m.id)}
                  onChange={() => toggleMember(m.id)}
                  className="w-4 h-4 accent-indigo-600"
                />
                {m.image ? (
                  <img src={m.image} alt={m.name ?? ""} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                    {(m.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {m.name ?? "Naamloos"}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Opslaan
        </button>
      </div>
    </form>
  );
}

export default function ListsClient({ lists: initialLists, members, currentUserId, isParent }: Props) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(data: FormState) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          color: data.color,
          visibility: data.visibility,
          memberIds: data.memberIds,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Mislukt");
        return;
      }
      const newList = await res.json();
      setLists((prev) => [
        ...prev,
        {
          id: newList.id,
          name: newList.name,
          color: newList.color,
          visibility: newList.visibility,
          ownerId: newList.ownerId,
          memberIds: (newList.members ?? []).map((m: { userId: string }) => m.userId),
        },
      ]);
      setCreating(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(listId: string, data: FormState) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          color: data.color,
          visibility: data.visibility,
          memberIds: data.memberIds,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Mislukt");
        return;
      }
      const updated = await res.json();
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? {
                ...l,
                name: updated.name,
                color: updated.color,
                visibility: updated.visibility,
                memberIds: (updated.members ?? []).map((m: { userId: string }) => m.userId),
              }
            : l
        )
      );
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(listId: string) {
    setDeletingId(listId);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Mislukt");
        return;
      }
      setLists((prev) => prev.filter((l) => l.id !== listId));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  function canManage(list: ListItem) {
    return list.ownerId === currentUserId || isParent;
  }

  function memberNamesFor(list: ListItem) {
    return list.memberIds
      .map((id) => members.find((m) => m.id === id)?.name ?? "?")
      .join(", ");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lijsten</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Organiseer taken in lijsten
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); setError(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe lijst
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {creating && (
        <div className="mb-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Nieuwe lijst</p>
          <ListForm
            initial={{ name: "", color: COLORS[0], visibility: "FAMILY", memberIds: [] }}
            members={members}
            currentUserId={currentUserId}
            onSave={handleCreate}
            onCancel={() => { setCreating(false); setError(null); }}
            saving={saving}
          />
        </div>
      )}

      {lists.length === 0 && !creating ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-sm">Nog geen lijsten. Maak je eerste lijst aan!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <div
              key={list.id}
              className="rounded-xl border border-[var(--border)] bg-white dark:bg-gray-900 overflow-hidden"
            >
              {editingId === list.id ? (
                <div className="p-4">
                  <ListForm
                    initial={{
                      name: list.name,
                      color: list.color ?? COLORS[0],
                      visibility: list.visibility,
                      memberIds: list.memberIds,
                    }}
                    members={members}
                    currentUserId={currentUserId}
                    onSave={(data) => handleEdit(list.id, data)}
                    onCancel={() => { setEditingId(null); setError(null); }}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 px-4 py-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: list.color ?? "#6366f1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {list.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {visibilityIcon[list.visibility]}
                      <span>{visibilityLabel[list.visibility]}</span>
                      {list.visibility === "SHARED" && list.memberIds.length > 0 && (
                        <span>· {memberNamesFor(list)}</span>
                      )}
                    </div>
                  </div>
                  {canManage(list) && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingId(list.id); setCreating(false); setError(null); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Bewerken"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(list.id)}
                        disabled={deletingId === list.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                        title="Verwijderen"
                      >
                        {deletingId === list.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

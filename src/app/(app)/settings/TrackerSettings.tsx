"use client";

import { useState } from "react";

interface FamilyMember {
  id: string;
  name: string | null;
  email: string | null;
  role: "PARENT" | "CHILD";
  trackerEnabled: boolean;
}

interface TrackerSettingsProps {
  members: FamilyMember[];
}

export function TrackerSettings({ members }: TrackerSettingsProps) {
  const children = members.filter((m) => m.role === "CHILD");
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(children.map((c) => [c.id, c.trackerEnabled])),
  );
  const [saving, setSaving] = useState<string | null>(null);

  if (children.length === 0) return null;

  async function toggle(userId: string, enabled: boolean) {
    setSaving(userId);
    try {
      const res = await fetch(`/api/family/members/${userId}/tracker`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackerEnabled: enabled }),
      });
      if (res.ok) {
        setStates((prev) => ({ ...prev, [userId]: enabled }));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      {children.map((child) => (
        <div
          key={child.id}
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderColor: "var(--arc-border)" }}
        >
          <span className="text-xl w-6 text-center shrink-0">🌙</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              Nacht-tracker: {child.name ?? child.email ?? "Kind"}
            </p>
            <p className="text-[10px] text-[var(--arc-muted)] mt-0.5">
              Privé bedplassen-tracker aanzetten
            </p>
          </div>
          <button
            onClick={() => toggle(child.id, !states[child.id])}
            disabled={saving === child.id}
            className="shrink-0 relative transition-opacity disabled:opacity-50"
            style={{ width: 44, height: 24 }}
            aria-label={states[child.id] ? "Uitzetten" : "Aanzetten"}
          >
            <div
              className="w-full h-full rounded-full transition-colors"
              style={{
                background: states[child.id] ? "#6366f1" : "rgba(255,255,255,0.15)",
              }}
            />
            <div
              className="absolute top-0.5 rounded-full transition-transform"
              style={{
                width: 20,
                height: 20,
                background: "white",
                left: states[child.id] ? 22 : 2,
              }}
            />
          </button>
        </div>
      ))}
    </>
  );
}

"use client";

import { useState } from "react";

interface DayNoteEditorProps {
  /** "YYYY-MM-DD" of the day being edited, or null when closed. */
  dateStr: string | null;
  initialNote: string;
  childId: string;
  onClose: () => void;
  onSaved: (dateStr: string, note: string | null) => void;
}

const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function DayNoteEditor({
  dateStr,
  initialNote,
  childId,
  onClose,
  onSaved,
}: DayNoteEditorProps) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  if (!dateStr) return null;

  async function save(value: string) {
    if (!dateStr) return;
    setSaving(true);
    try {
      const res = await fetch("/api/daynotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, note: value, child: childId }),
      });
      if (res.ok) {
        const trimmed = value.trim();
        onSaved(dateStr, trimmed ? trimmed : null);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4"
        style={{ background: "var(--arc-panel,#15142e)", border: "1px solid var(--arc-border-str,rgba(255,255,255,0.12))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--arc-muted,#8e8eb6)] uppercase tracking-wider font-semibold">
              Notitie
            </p>
            <p className="font-bold text-lg">{formatDate(dateStr)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--arc-muted,#8e8eb6)] hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            ✕
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Bijv. verjaardagsfeestje, laat naar bed, veel gedronken, ziek…"
          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none bg-transparent border outline-none focus:border-[var(--xp-accent,#06d6c4)]"
          style={{ borderColor: "var(--border,rgba(255,255,255,0.12))", color: "var(--foreground)" }}
        />

        <div className="flex gap-2">
          <button
            onClick={() => save(note)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: "var(--gold,#facc15)", color: "#1a1a1a" }}
          >
            {saving ? "Opslaan…" : "Opslaan"}
          </button>
          {initialNote && (
            <button
              onClick={() => save("")}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#f87171] transition-opacity disabled:opacity-50"
              style={{ background: "rgba(248,113,113,0.1)" }}
            >
              Verwijderen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

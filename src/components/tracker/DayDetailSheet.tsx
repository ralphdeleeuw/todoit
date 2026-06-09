"use client";

import { useState } from "react";
import type { NightStatus } from "@prisma/client";
import { NightPicker } from "@/components/tracker/NightPicker";

interface DayDetailSheetProps {
  /** "YYYY-MM-DD" of the day, or null when closed. */
  dateStr: string | null;
  initialStatus: NightStatus | null;
  initialNote: string;
  childId: string;
  /** Whether the current viewer may edit the note (parents only). */
  canEditNote: boolean;
  /** True while a status change is being saved. */
  savingStatus: boolean;
  onClose: () => void;
  onSelectStatus: (status: NightStatus) => void;
  onNoteSaved: (dateStr: string, note: string | null) => void;
}

const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function DayDetailSheet({
  dateStr,
  initialStatus,
  initialNote,
  childId,
  canEditNote,
  savingStatus,
  onClose,
  onSelectStatus,
  onNoteSaved,
}: DayDetailSheetProps) {
  const [selected, setSelected] = useState<NightStatus | null>(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [savingNote, setSavingNote] = useState(false);

  if (!dateStr) return null;

  function pickStatus(status: NightStatus) {
    setSelected(status);
    onSelectStatus(status);
  }

  async function saveNote(value: string) {
    if (!dateStr) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/daynotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, note: value, child: childId }),
      });
      if (res.ok) {
        const trimmed = value.trim();
        onNoteSaved(dateStr, trimmed ? trimmed : null);
        onClose();
      }
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 text-white max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--arc-panel,#15142e)", border: "1px solid var(--arc-border-str,rgba(255,255,255,0.12))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--arc-muted,#8e8eb6)] uppercase tracking-wider font-semibold">
              Deze nacht
            </p>
            <p className="font-bold text-lg text-white">{formatDate(dateStr)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--arc-muted,#8e8eb6)] hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            ✕
          </button>
        </div>

        {/* Status picker — everyone can (re)fill the status for this day */}
        <NightPicker selected={selected} onSelect={pickStatus} loading={savingStatus} />

        {/* Note section */}
        <div className="pt-1">
          <p className="text-xs text-[var(--arc-muted,#8e8eb6)] uppercase tracking-wider font-semibold mb-2">
            Notitie
          </p>
          {canEditNote ? (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Bijv. verjaardagsfeestje, laat naar bed, veel gedronken, ziek…"
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none bg-transparent border outline-none text-white placeholder:text-[var(--arc-muted,#8e8eb6)] focus:border-[var(--xp-accent,#06d6c4)]"
                style={{ borderColor: "var(--arc-border-str,rgba(255,255,255,0.18))" }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => saveNote(note)}
                  disabled={savingNote}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
                  style={{ background: "var(--gold,#facc15)", color: "#1a1a1a" }}
                >
                  {savingNote ? "Opslaan…" : "Notitie opslaan"}
                </button>
                {initialNote && (
                  <button
                    onClick={() => saveNote("")}
                    disabled={savingNote}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#f87171] transition-opacity disabled:opacity-50"
                    style={{ background: "rgba(248,113,113,0.1)" }}
                  >
                    Verwijderen
                  </button>
                )}
              </div>
            </>
          ) : (
            <p
              className="text-sm whitespace-pre-wrap rounded-xl px-3 py-2.5 text-white"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {initialNote || "Geen notitie voor deze dag."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

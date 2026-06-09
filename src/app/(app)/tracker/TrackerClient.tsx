"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { NightStatus } from "@prisma/client";
import { NightPicker } from "@/components/tracker/NightPicker";
import { DryStreakBanner } from "@/components/tracker/DryStreakBanner";
import { StarCalendar } from "@/components/tracker/StarCalendar";
import { MilestoneBadges } from "@/components/tracker/MilestoneBadges";
import { RewardGoalCard } from "@/components/tracker/RewardGoalCard";
import { DayDetailSheet } from "@/components/tracker/DayDetailSheet";
import { CompletionEffect } from "@/components/tasks/CompletionEffect";
import type { NightStats } from "@/lib/nightlog";

interface NightLogEntry {
  date: string;
  status: NightStatus;
  points: number;
}

interface DayNote {
  date: string;
  note: string;
}

interface RewardGoal {
  id: string;
  title: string;
  emoji: string | null;
  targetPoints: number;
  progress: number;
  achievedAt: string | null;
}

interface TrackerData {
  logs: NightLogEntry[];
  stats: NightStats;
  activeGoal: (RewardGoal & { progress: number }) | null;
}

interface TrackedChild {
  id: string;
  name: string | null;
}

interface TrackerClientProps {
  childId: string;
  initialData: TrackerData;
  initialYear: number;
  initialMonth: number;
  todayStatus: NightStatus | null;
  /** True when a parent is viewing one of their children's tracker. */
  isParentView?: boolean;
  /** Name of the child being viewed (null when viewing your own). */
  viewingName?: string | null;
  /** Tracker-enabled children a parent can switch between. */
  trackedChildren?: TrackedChild[];
  /** Day notes for the viewed child (parents only). */
  initialNotes?: DayNote[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TrackerClient({
  childId,
  initialData,
  initialYear,
  initialMonth,
  todayStatus,
  isParentView = false,
  viewingName = null,
  trackedChildren = [],
  initialNotes = [],
}: TrackerClientProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedStatus, setSelectedStatus] = useState<NightStatus | null>(todayStatus);
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState<string | null>(null);
  const [newlyReachedBadges, setNewlyReachedBadges] = useState<string[]>([]);
  const [activeGoal, setActiveGoal] = useState<RewardGoal | null>(initialData.activeGoal);
  const prevMilestonesRef = useRef<string[]>(initialData.stats.milestonesReached);

  // Day notes (parents only): map of "YYYY-MM-DD" -> note text.
  const [notes, setNotes] = useState<Record<string, string>>(
    () => Object.fromEntries(initialNotes.map((n) => [n.date.slice(0, 10), n.note])),
  );
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const monthKey = `/api/nightlog?month=${year}-${String(month).padStart(2, "0")}&child=${childId}`;
  const allKey = `/api/nightlog?child=${childId}`;

  const { data: monthData, mutate: mutateMonth } = useSWR<TrackerData>(monthKey, fetcher, {
    fallbackData: year === initialYear && month === initialMonth ? initialData : undefined,
  });
  const { data: allData, mutate: mutateAll } = useSWR<TrackerData>(allKey, fetcher, {
    fallbackData: initialData,
  });

  const stats = allData?.stats ?? initialData.stats;
  const monthLogs = monthData?.logs ?? [];

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  // Quick lookup of the logged status per day in the shown month.
  const statusByDate: Record<string, NightStatus> = Object.fromEntries(
    monthLogs.map((l) => [l.date.slice(0, 10), l.status]),
  );

  // Sets/updates the night status for a given day (today or a forgotten past day).
  async function submitStatus(status: NightStatus, dateStr: string) {
    if (dateStr === todayStr) setSelectedStatus(status);
    setLoading(true);

    try {
      const res = await fetch("/api/nightlog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, status, child: childId }),
      });

      if (res.ok) {
        const data: { log: NightLogEntry; stats: NightStats; activeGoal: RewardGoal | null } =
          await res.json();

        // Trigger star effect on dry pick
        if (status === "DRY" || status === "DRY_MEDS") {
          setEffect("stars");
        }

        // Detect newly reached milestones
        const prev = new Set(prevMilestonesRef.current);
        const newBadges = data.stats.milestonesReached.filter((id) => !prev.has(id));
        if (newBadges.length > 0) {
          setNewlyReachedBadges(newBadges);
          setTimeout(() => setEffect("fireworks"), 600);
        }
        prevMilestonesRef.current = data.stats.milestonesReached;

        if (data.activeGoal) setActiveGoal(data.activeGoal);

        await Promise.all([mutateMonth(), mutateAll()]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleMonthChange(y: number, m: number) {
    setYear(y);
    setMonth(m);
  }

  const showSelector = isParentView && trackedChildren.length > 1;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">
          🌙 {viewingName ? `Nachten van ${viewingName}` : "Mijn Nachten"}
        </h1>
        <p className="text-sm text-[var(--arc-muted,#8e8eb6)] mt-0.5">
          {isParentView ? "Overzicht van de nachten" : "Hoe ging het afgelopen nacht?"}
        </p>
      </div>

      {/* Child selector (parents with multiple tracked children) */}
      {showSelector && (
        <div className="flex flex-wrap gap-2">
          {trackedChildren.map((c) => {
            const active = c.id === childId;
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/tracker?child=${c.id}`)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, var(--xp-accent,#06d6c4), var(--accent-primary,#7c3aed))",
                        color: "#fff",
                      }
                    : {
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--arc-muted,#8e8eb6)",
                      }
                }
              >
                {c.name ?? "Kind"}
              </button>
            );
          })}
        </div>
      )}

      {/* Streak banner */}
      <DryStreakBanner
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
      />

      {/* Night picker — for today */}
      <NightPicker
        selected={selectedStatus}
        onSelect={(status) => submitStatus(status, todayStr)}
        loading={loading}
      />

      {/* Calendar */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <StarCalendar
          year={year}
          month={month}
          logs={monthLogs}
          onMonthChange={handleMonthChange}
          noteDates={new Set(Object.keys(notes))}
          onDayClick={(d) => setEditingDate(d)}
          allowEmptyClick={true}
        />
        <p
          className="text-xs text-center mt-3 rounded-lg py-2 px-3"
          style={{ background: "rgba(6,214,196,0.1)", color: "var(--xp-accent,#06d6c4)" }}
        >
          👆 {isParentView
            ? "Tik op een dag om de status of notitie aan te passen"
            : "Tik op een dag om een vergeten nacht alsnog in te vullen"}
        </p>
      </div>

      {/* Milestone badges */}
      <MilestoneBadges
        reached={stats.milestonesReached}
        newlyReached={newlyReachedBadges}
      />

      {/* Reward goal */}
      <RewardGoalCard
        goal={activeGoal}
        childId={childId}
        onGoalCreated={(g) => setActiveGoal(g)}
        onGoalRedeemed={() => setActiveGoal(null)}
      />

      {/* Celebration effects */}
      <CompletionEffect
        effect={effect ?? "stars"}
        show={effect !== null}
        onDismiss={() => {
          setEffect(null);
          setNewlyReachedBadges([]);
        }}
      />

      {/* Day detail — fill in status (everyone) + note (read-only for child) */}
      <DayDetailSheet
        key={editingDate ?? "closed"}
        dateStr={editingDate}
        initialStatus={editingDate ? statusByDate[editingDate] ?? null : null}
        initialNote={editingDate ? notes[editingDate] ?? "" : ""}
        childId={childId}
        canEditNote={isParentView}
        savingStatus={loading}
        onClose={() => setEditingDate(null)}
        onSelectStatus={(status) => editingDate && submitStatus(status, editingDate)}
        onNoteSaved={(dateStr, note) =>
          setNotes((prev) => {
            const next = { ...prev };
            if (note) next[dateStr] = note;
            else delete next[dateStr];
            return next;
          })
        }
      />
    </div>
  );
}

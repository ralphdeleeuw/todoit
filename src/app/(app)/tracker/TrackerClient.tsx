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
import { DayNoteEditor } from "@/components/tracker/DayNoteEditor";
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

  async function handleSelect(status: NightStatus) {
    setSelectedStatus(status);
    setLoading(true);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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

      {/* Night picker */}
      <NightPicker
        selected={selectedStatus}
        onSelect={handleSelect}
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
          noteDates={isParentView ? new Set(Object.keys(notes)) : undefined}
          onDayClick={isParentView ? (d) => setEditingDate(d) : undefined}
        />
        {isParentView && (
          <p className="text-[11px] text-[var(--arc-muted,#8e8eb6)] text-center mt-3">
            Tik op een dag om een notitie toe te voegen 📝
          </p>
        )}
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

      {/* Day note editor (parents only) */}
      {isParentView && (
        <DayNoteEditor
          key={editingDate ?? "closed"}
          dateStr={editingDate}
          initialNote={editingDate ? notes[editingDate] ?? "" : ""}
          childId={childId}
          onClose={() => setEditingDate(null)}
          onSaved={(dateStr, note) =>
            setNotes((prev) => {
              const next = { ...prev };
              if (note) next[dateStr] = note;
              else delete next[dateStr];
              return next;
            })
          }
        />
      )}
    </div>
  );
}

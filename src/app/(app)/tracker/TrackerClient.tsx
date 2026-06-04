"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import type { NightStatus } from "@prisma/client";
import { NightPicker } from "@/components/tracker/NightPicker";
import { DryStreakBanner } from "@/components/tracker/DryStreakBanner";
import { StarCalendar } from "@/components/tracker/StarCalendar";
import { MilestoneBadges } from "@/components/tracker/MilestoneBadges";
import { RewardGoalCard } from "@/components/tracker/RewardGoalCard";
import { CompletionEffect } from "@/components/tasks/CompletionEffect";
import type { NightStats } from "@/lib/nightlog";
import type { NIGHT_MILESTONES } from "@/lib/arcade";

type Milestone = typeof NIGHT_MILESTONES[number];

interface NightLogEntry {
  date: string;
  status: NightStatus;
  points: number;
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

interface TrackerClientProps {
  childId: string;
  initialData: TrackerData;
  initialYear: number;
  initialMonth: number;
  todayStatus: NightStatus | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TrackerClient({
  childId,
  initialData,
  initialYear,
  initialMonth,
  todayStatus,
}: TrackerClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedStatus, setSelectedStatus] = useState<NightStatus | null>(todayStatus);
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState<string | null>(null);
  const [newlyReachedBadges, setNewlyReachedBadges] = useState<string[]>([]);
  const [activeGoal, setActiveGoal] = useState<RewardGoal | null>(initialData.activeGoal);
  const prevMilestonesRef = useRef<string[]>(initialData.stats.milestonesReached);

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

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">🌙 Mijn Nachten</h1>
        <p className="text-sm text-[var(--arc-muted,#8e8eb6)] mt-0.5">
          Hoe ging het afgelopen nacht?
        </p>
      </div>

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
        />
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
    </div>
  );
}

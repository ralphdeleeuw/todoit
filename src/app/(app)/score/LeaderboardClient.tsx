"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";

const PILL_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];
const PERIOD_LABELS = ["Deze week", "Maand", "Totaal"] as const;
type Period = typeof PERIOD_LABELS[number];

interface Member {
  id: string;
  name: string | null;
  image: string | null;
  xp: number;
  weekXp: number;
  streak: number;
  level: number;
}

interface DayData {
  label: string;
  data: Record<string, number>;
}

interface Props {
  members: Member[];
  currentUserId: string;
  days: DayData[];
}

const MEDAL = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = [
  { bg: "linear-gradient(135deg, #facc15, #f59e0b)", text: "#1a1000" },
  { bg: "linear-gradient(135deg, #d1d5db, #9ca3af)", text: "#1a1a1a" },
  { bg: "linear-gradient(135deg, #cd7c2f, #a05c1e)", text: "#fff" },
];

export function LeaderboardClient({ members, currentUserId, days }: Props) {
  const [period, setPeriod] = useState<Period>("Deze week");

  const sorted = [...members].sort((a, b) => {
    if (period === "Deze week") return b.weekXp - a.weekXp;
    return b.xp - a.xp;
  });

  const getXp = (m: Member) => period === "Deze week" ? m.weekXp : m.xp;

  // podium: positions [1st(idx0), 2nd(idx1), 3rd(idx2)]
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // For chart: max XP in any day
  const maxDay = Math.max(...days.map((d) => Object.values(d.data).reduce((s, v) => s + v, 0)), 1);

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: "var(--gold)" }} />
          <h1 className="text-xl font-black text-white tracking-tight">Top 4</h1>
        </div>
        <Link
          href="/achievements"
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: "var(--arc-panel-2)", color: "var(--arc-muted)", border: "1px solid var(--arc-border)" }}
        >
          Badges
        </Link>
      </header>

      {/* Period switcher */}
      <div
        className="mx-4 mt-2 mb-4 flex rounded-2xl p-1"
        style={{ background: "var(--arc-panel)" }}
      >
        {PERIOD_LABELS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all",
              period === p ? "text-white" : "text-[var(--arc-muted)]"
            )}
            style={
              period === p
                ? { background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))" }
                : undefined
            }
          >
            {p}
          </button>
        ))}
      </div>

      {/* Podium card */}
      {top3.length > 0 && (
        <div
          className="mx-4 mb-4 rounded-[22px] p-5"
          style={{
            background: "linear-gradient(135deg, #1d1c3d, #15142e)",
            border: "1px solid var(--arc-border-str)",
            boxShadow: "0 0 40px rgba(250,204,21,0.08)",
          }}
        >
          <div className="flex items-end justify-center gap-3">
            {/* 2nd */}
            {top3[1] && <PodiumMember member={top3[1]} rank={2} xp={getXp(top3[1])} colorIdx={members.indexOf(top3[1])} height={80} />}
            {/* 1st */}
            {top3[0] && <PodiumMember member={top3[0]} rank={1} xp={getXp(top3[0])} colorIdx={members.indexOf(top3[0])} height={110} crown />}
            {/* 3rd */}
            {top3[2] && <PodiumMember member={top3[2]} rank={3} xp={getXp(top3[2])} colorIdx={members.indexOf(top3[2])} height={65} />}
          </div>
        </div>
      )}

      {/* Rank 4+ */}
      {rest.map((m, i) => {
        const rank = i + 4;
        const color = PILL_COLORS[members.indexOf(m) % PILL_COLORS.length];
        const initial = (m.name ?? "?")[0].toUpperCase();
        return (
          <div
            key={m.id}
            className="mx-4 mb-2 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border)" }}
          >
            <span className="text-sm font-black text-[var(--arc-muted)] w-5 tabular-nums">#{rank}</span>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden shrink-0" style={{ background: color }}>
              {m.image ? <img src={m.image} alt="" className="w-full h-full object-cover rounded-full" /> : initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{m.name ?? "–"}</p>
              {m.streak > 0 && <p className="text-[10px] text-[var(--arc-muted)]">🔥 {m.streak} dagen streak</p>}
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--gold)" }}>💎 {getXp(m)}</span>
          </div>
        );
      })}

      {/* Weekly history chart */}
      <div
        className="mx-4 mt-4 rounded-[22px] p-4"
        style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border)" }}
      >
        <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-3">
          Afgelopen 7 dagen
        </p>
        <div className="flex items-end gap-1.5 h-20">
          {days.map((day) => {
            const total = Object.values(day.data).reduce((s, v) => s + v, 0);
            const pct = total / maxDay;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ height: `${Math.max(pct * 64, total > 0 ? 4 : 0)}px` }}>
                  {members.map((m, mi) => {
                    const v = day.data[m.id] ?? 0;
                    if (!v) return null;
                    const segPct = v / total;
                    return (
                      <div
                        key={m.id}
                        style={{
                          height: `${segPct * 100}%`,
                          background: PILL_COLORS[mi % PILL_COLORS.length],
                          minHeight: 2,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] text-[var(--arc-muted-deep)]">{day.label}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--arc-border)" }}>
          {members.map((m, i) => (
            <div key={m.id} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PILL_COLORS[i % PILL_COLORS.length] }} />
              <span className="text-[10px] text-[var(--arc-muted)]">{m.name?.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}

function PodiumMember({
  member, rank, xp, colorIdx, height, crown,
}: {
  member: Member; rank: number; xp: number; colorIdx: number; height: number; crown?: boolean;
}) {
  const color = PILL_COLORS[colorIdx % PILL_COLORS.length];
  const medal = MEDAL_COLORS[rank - 1];
  const initial = (member.name ?? "?")[0].toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      {crown && <span className="text-base">👑</span>}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white overflow-hidden border-2"
        style={{ background: color, borderColor: color, boxShadow: `0 0 12px ${color}66` }}
      >
        {member.image
          ? <img src={member.image} alt="" className="w-full h-full object-cover rounded-full" />
          : initial
        }
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-semibold text-white">{member.name?.split(" ")[0]}</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--gold)" }}>💎 {xp}</span>
      </div>
      <div
        className="w-full rounded-t-xl flex items-center justify-center text-sm font-black"
        style={{ height, background: medal.bg, color: medal.text }}
      >
        {rank}
      </div>
    </div>
  );
}

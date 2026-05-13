"use client";

import { calcLevel, xpIntoCurrentLevel } from "@/lib/arcade";
import type { ArcadeMember } from "@/types";

interface LevelCardProps {
  member: ArcadeMember;
  weekRank?: number;
}

export function LevelCard({ member, weekRank }: LevelCardProps) {
  const level = calcLevel(member.xp);
  const xpIn = xpIntoCurrentLevel(member.xp);
  const pct = Math.round((xpIn / 500) * 100);
  const initial = (member.name ?? "?")[0].toUpperCase();

  return (
    <div
      className="mx-4 mb-4 rounded-[22px] p-4"
      style={{
        background: "linear-gradient(135deg, #1d1c3d 0%, #15142e 100%)",
        border: "1px solid var(--arc-border-str)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with conic-gradient ring */}
        <div className="relative shrink-0">
          <div
            className="w-16 h-16 rounded-full p-0.5"
            style={{
              background: `conic-gradient(var(--xp-accent) ${pct}%, rgba(255,255,255,0.08) 0%)`,
            }}
          >
            <div className="w-full h-full rounded-full bg-[var(--arc-panel)] flex items-center justify-center overflow-hidden">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name ?? ""}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-xl font-bold text-white">{initial}</span>
              )}
            </div>
          </div>
          {/* LV badge */}
          <div
            className="absolute -bottom-1 -right-1 text-[10px] font-black px-1.5 py-0.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, #facc15, #f59e0b)",
              color: "#1a1000",
              lineHeight: 1,
            }}
          >
            LV {level}
          </div>
        </div>

        {/* Name + XP info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-base truncate">
              {member.name ?? "Speler"}
            </span>
            {member.streak > 0 && (
              <span className="text-sm">
                🔥 <span className="text-[var(--combo-warn)] text-xs font-bold">{member.streak}</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-[var(--arc-muted)] mt-0.5 tabular-nums">
            {xpIn} / 500 XP naar level {level + 1}
          </div>

          {/* XP progress bar */}
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(to right, var(--xp-accent), var(--gold))",
              }}
            />
          </div>
        </div>
      </div>

      {/* 3-stat grid */}
      <div
        className="mt-3 grid grid-cols-3 gap-2 pt-3"
        style={{ borderTop: "1px solid var(--arc-border)" }}
      >
        <Stat icon="⚡" label="Week XP" value={member.weekXp} />
        <Stat icon="💎" label="Totaal" value={member.xp} />
        <Stat icon="🎯" label="Rank" value={weekRank ? `#${weekRank}` : "–"} />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-base">{icon}</span>
      <span className="text-white font-bold text-sm tabular-nums">{value}</span>
      <span className="text-[10px] text-[var(--arc-muted)]">{label}</span>
    </div>
  );
}

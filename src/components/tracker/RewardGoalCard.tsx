"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RewardGoal {
  id: string;
  title: string;
  emoji: string | null;
  targetPoints: number;
  progress: number;
  achievedAt: string | null;
}

interface RewardGoalCardProps {
  goal: RewardGoal | null;
  childId?: string;
  onGoalCreated?: (goal: RewardGoal) => void;
  onGoalRedeemed?: (goalId: string) => void;
}

export function RewardGoalCard({ goal, childId, onGoalCreated, onGoalRedeemed }: RewardGoalCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [targetPoints, setTargetPoints] = useState(100);
  const [saving, setSaving] = useState(false);

  const pct = goal ? Math.min(100, Math.round((goal.progress / goal.targetPoints) * 100)) : 0;
  const achieved = goal?.achievedAt != null;

  async function createGoal() {
    if (!title || targetPoints <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reward-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, emoji, targetPoints, child: childId }),
      });
      if (res.ok) {
        const data = await res.json();
        onGoalCreated?.(data);
        setShowForm(false);
        setTitle("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function redeemGoal() {
    if (!goal) return;
    const res = await fetch(`/api/reward-goals/${goal.id}/redeem`, { method: "POST" });
    if (res.ok) onGoalRedeemed?.(goal.id);
  }

  if (!goal && !showForm) {
    return (
      <div
        className="rounded-2xl p-4 text-center cursor-pointer hover:opacity-80 transition-opacity"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px dashed rgba(255,255,255,0.15)",
        }}
        onClick={() => setShowForm(true)}
      >
        <p className="text-2xl mb-1">🎯</p>
        <p className="text-sm font-semibold text-[var(--foreground)]">Stel een doel in</p>
        <p className="text-xs text-[var(--arc-muted,#8e8eb6)]">Spaar voor iets leuks!</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.25)" }}
      >
        <p className="font-bold text-sm">Nieuw spaardoel</p>
        <div className="flex gap-2">
          <input
            className="w-10 text-center bg-transparent border border-[var(--border)] rounded-lg text-lg"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={2}
          />
          <input
            className="flex-1 bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            placeholder="Wat wil je winnen? (bijv. Dagje dierentuin)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--arc-muted,#8e8eb6)] shrink-0">Punten nodig:</label>
          <input
            type="number"
            min={1}
            className="w-20 bg-transparent border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
            value={targetPoints}
            onChange={(e) => setTargetPoints(Number(e.target.value))}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={createGoal}
            disabled={saving || !title}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: "var(--gold,#facc15)", color: "#1a1a1a" }}
          >
            {saving ? "Opslaan…" : "Opslaan"}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 rounded-xl text-sm text-[var(--arc-muted,#8e8eb6)]"
          >
            Annuleer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: achieved ? "rgba(34,197,94,0.1)" : "rgba(250,204,21,0.08)",
        border: `1px solid ${achieved ? "rgba(34,197,94,0.4)" : "rgba(250,204,21,0.25)"}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{goal!.emoji ?? "🎯"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{goal!.title}</p>
          <p className="text-xs text-[var(--arc-muted,#8e8eb6)]">
            {goal!.progress} / {goal!.targetPoints} punten
          </p>
        </div>
        {achieved && <span className="text-xl">🎉</span>}
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 10, background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: achieved
              ? "linear-gradient(90deg,#22c55e,#4ade80)"
              : "linear-gradient(90deg, var(--gold,#facc15), #f59e0b)",
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p
          className="text-xs font-bold"
          style={{ color: achieved ? "#4ade80" : "var(--gold,#facc15)" }}
        >
          {achieved ? "✓ Behaald! 🎊" : `${pct}%`}
        </p>
        <div className="flex gap-2">
          {pct >= 100 && !achieved && (
            <button
              onClick={redeemGoal}
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "var(--gold,#facc15)", color: "#1a1a1a" }}
            >
              Inwisselen! 🎁
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className={cn("text-xs text-[var(--arc-muted,#8e8eb6)] hover:text-[var(--foreground)] transition-colors")}
          >
            Nieuw doel
          </button>
        </div>
      </div>
    </div>
  );
}

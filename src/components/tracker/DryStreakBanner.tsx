"use client";

interface DryStreakBannerProps {
  currentStreak: number;
  longestStreak: number;
}

export function DryStreakBanner({ currentStreak, longestStreak }: DryStreakBannerProps) {
  const isRecord = currentStreak > 0 && currentStreak >= longestStreak;

  return (
    <div
      className="rounded-2xl p-4 flex items-center justify-between"
      style={{
        background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(6,214,196,0.15))",
        border: "1px solid rgba(250,204,21,0.3)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔥</span>
        <div>
          <p className="text-2xl font-bold" style={{ color: "var(--gold, #facc15)" }}>
            {currentStreak}
          </p>
          <p className="text-xs text-[var(--arc-muted,#8e8eb6)] font-medium">
            {currentStreak === 1 ? "droge nacht op rij" : "droge nachten op rij"}
          </p>
        </div>
      </div>

      <div className="text-right">
        {isRecord && currentStreak > 0 ? (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, var(--gold,#facc15), #f59e0b)",
              color: "#1a1a1a",
            }}
          >
            🏆 Nieuw record!
          </span>
        ) : (
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--xp-accent,#06d6c4)" }}>
              {longestStreak}
            </p>
            <p className="text-xs text-[var(--arc-muted,#8e8eb6)]">record</p>
          </div>
        )}
      </div>
    </div>
  );
}

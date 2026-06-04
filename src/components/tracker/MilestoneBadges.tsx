"use client";

import { NIGHT_MILESTONES } from "@/lib/arcade";
import { cn } from "@/lib/utils";

interface MilestoneBadgesProps {
  reached: string[];
  newlyReached?: string[];
}

export function MilestoneBadges({ reached, newlyReached = [] }: MilestoneBadgesProps) {
  const reachedSet = new Set(reached);
  const newSet = new Set(newlyReached);

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--arc-muted,#8e8eb6)] uppercase tracking-wider mb-3">
        Badges
      </p>
      <div className="flex flex-wrap gap-2">
        {NIGHT_MILESTONES.map((m) => {
          const isReached = reachedSet.has(m.id);
          const isNew = newSet.has(m.id);
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 transition-all",
                isReached ? "opacity-100" : "opacity-40 grayscale",
                isNew && "scale-110",
              )}
              style={{
                background: isReached
                  ? "rgba(250,204,21,0.15)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${isReached ? "rgba(250,204,21,0.4)" : "rgba(255,255,255,0.08)"}`,
                boxShadow: isNew ? "0 0 16px rgba(250,204,21,0.5)" : undefined,
              }}
            >
              <span className="text-xl">{m.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">{m.label}</p>
                {isNew && (
                  <p className="text-[10px]" style={{ color: "var(--gold,#facc15)" }}>
                    Nieuw! 🎉
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

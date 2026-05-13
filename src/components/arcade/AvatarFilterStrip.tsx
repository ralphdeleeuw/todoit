"use client";

import { cn } from "@/lib/utils";

interface StripMember {
  id: string;
  name: string | null;
  image: string | null;
}

interface AvatarFilterStripProps {
  members: StripMember[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Stable color palette for members without a stored color
const PILL_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

export function AvatarFilterStrip({ members, selectedId, onSelect }: AvatarFilterStripProps) {
  if (members.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
      {members.map((m, i) => {
        const color = PILL_COLORS[i % PILL_COLORS.length];
        const active = selectedId === m.id;
        const initial = (m.name ?? "?")[0].toUpperCase();

        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(active ? null : m.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all",
              active ? "text-white" : "text-[var(--arc-muted)]"
            )}
            style={
              active
                ? {
                    background: `${color}33`,
                    border: `1.5px solid ${color}`,
                    boxShadow: `0 0 8px ${color}66`,
                  }
                : {
                    background: "var(--arc-panel)",
                    border: "1.5px solid var(--arc-border)",
                  }
            }
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden text-[10px] font-bold"
              style={{ background: color, color: "#fff" }}
            >
              {m.image ? (
                <img src={m.image} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                initial
              )}
            </div>
            {m.name?.split(" ")[0]}
          </button>
        );
      })}

      {selectedId && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex items-center justify-center w-7 h-7 rounded-full text-[var(--arc-muted)] shrink-0 transition-colors hover:text-white"
          style={{ background: "var(--arc-panel)", border: "1.5px solid var(--arc-border)" }}
          aria-label="Filter wissen"
        >
          ✕
        </button>
      )}
    </div>
  );
}

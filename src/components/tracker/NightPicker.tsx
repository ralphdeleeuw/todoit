"use client";

import type { NightStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Option {
  status: NightStatus;
  emoji: string;
  label: string;
  sublabel: string;
  message: string;
  bg: string;
  border: string;
  selectedBg: string;
}

const OPTIONS: Option[] = [
  {
    status: "DRY",
    emoji: "☀️",
    label: "Droog",
    sublabel: "Zonder medicijnen",
    message: "Top! Helemaal zelf droog! ⭐",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.3)",
    selectedBg: "rgba(34,197,94,0.2)",
  },
  {
    status: "DRY_MEDS",
    emoji: "💊",
    label: "Droog",
    sublabel: "Met medicijnen",
    message: "Goed gedaan, lekker droog gebleven! 💪",
    bg: "rgba(6,214,196,0.08)",
    border: "rgba(6,214,196,0.3)",
    selectedBg: "rgba(6,214,196,0.2)",
  },
  {
    status: "WET",
    emoji: "🌧️",
    label: "Nat",
    sublabel: "Zonder medicijnen",
    message: "Geeft niks, morgen weer een nieuwe kans 🌈",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.25)",
    selectedBg: "rgba(99,102,241,0.18)",
  },
  {
    status: "WET_MEDS",
    emoji: "💊",
    label: "Nat",
    sublabel: "Met medicijnen",
    message: "Het went vanzelf, je doet het super 🌟",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.25)",
    selectedBg: "rgba(99,102,241,0.18)",
  },
];

interface NightPickerProps {
  selected: NightStatus | null;
  onSelect: (status: NightStatus) => void;
  loading?: boolean;
}

export function NightPicker({ selected, onSelect, loading = false }: NightPickerProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--arc-muted,#8e8eb6)] uppercase tracking-wider mb-3">
        Hoe was afgelopen nacht?
      </p>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.status;
          return (
            <button
              key={opt.status}
              onClick={() => !loading && onSelect(opt.status)}
              disabled={loading}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all",
                "border active:scale-95 disabled:opacity-60",
                isSelected ? "scale-[1.02] shadow-lg" : "hover:scale-[1.01]",
              )}
              style={{
                background: isSelected ? opt.selectedBg : opt.bg,
                borderColor: isSelected ? opt.border.replace("0.3", "0.7") : opt.border,
                boxShadow: isSelected ? `0 4px 20px ${opt.border}` : undefined,
              }}
            >
              <span className="text-3xl leading-none">{opt.emoji}</span>
              <div>
                <p className="font-bold text-sm text-[var(--foreground)]">{opt.label}</p>
                <p className="text-xs text-[var(--arc-muted,#8e8eb6)]">{opt.sublabel}</p>
              </div>
              {isSelected && (
                <p className="text-xs font-medium" style={{ color: opt.border.replace("rgba(", "rgb(").replace(",0.3)", ")").replace(",0.25)", ")") }}>
                  ✓ {opt.message}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { OPTIONS as NIGHT_OPTIONS };

"use client";

import { Plus } from "lucide-react";

interface ArcadeFABProps {
  onClick: () => void;
}

export function ArcadeFAB({ onClick }: ArcadeFABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Nieuwe taak"
      className="fixed z-30 flex items-center justify-center rounded-full text-white transition-transform active:scale-95"
      style={{
        width: 60,
        height: 60,
        bottom: 88,
        right: 20,
        background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))",
        boxShadow:
          "0 12px 30px rgba(124,58,237,0.55), 0 0 24px rgba(6,214,196,0.35)",
      }}
    >
      <Plus className="w-7 h-7" strokeWidth={2.5} />
    </button>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function DailyReminderToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !enabled;
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyReminderEnabled: next }),
      });
      if (res.ok) setEnabled(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Dagelijkse samenvatting</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Elke ochtend een melding met openstaande taken en taken die morgen vervallen
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={loading}
        className="relative shrink-0 ml-4"
      >
        <div className={cn(
          "w-11 h-6 rounded-full transition-colors",
          enabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
        )} />
        <div className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

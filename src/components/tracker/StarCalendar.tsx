"use client";

import type { NightStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CalendarEntry {
  date: string; // ISO date
  status: NightStatus;
}

interface StarCalendarProps {
  year: number;
  month: number; // 1-12
  logs: CalendarEntry[];
  onMonthChange: (year: number, month: number) => void;
  /** Set of "YYYY-MM-DD" dates that have a note (shown with a 📝 dot). */
  noteDates?: Set<string>;
  /** When provided, day cells become tappable (e.g. for parents to add a note). */
  onDayClick?: (dateStr: string) => void;
}

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function statusEmoji(status: NightStatus): string {
  if (status === "DRY") return "⭐";
  if (status === "DRY_MEDS") return "🌟";
  return "💧";
}

function statusColor(status: NightStatus): string {
  if (status === "DRY") return "#facc15";
  if (status === "DRY_MEDS") return "#06d6c4";
  return "#818cf8";
}

export function StarCalendar({ year, month, logs, onMonthChange, noteDates, onDayClick }: StarCalendarProps) {
  const logMap = new Map(logs.map((l) => {
    const d = new Date(l.date);
    return [`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, l.status];
  }));

  const firstDay = new Date(year, month - 1, 1);
  // ISO: Monday = 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const MONTH_NAMES = [
    "Januari","Februari","Maart","April","Mei","Juni",
    "Juli","Augustus","September","Oktober","November","December",
  ];

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }
  function nextMonth() {
    const next = new Date(year, month, 1);
    if (next <= today) {
      if (month === 12) onMonthChange(year + 1, 1);
      else onMonthChange(year, month + 1);
    }
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  const isNextAllowed = new Date(year, month, 1) <= today;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--arc-muted,#8e8eb6)] hover:text-[var(--foreground)] transition-colors"
        >
          ‹
        </button>
        <p className="font-bold text-sm">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <button
          onClick={nextMonth}
          disabled={!isNextAllowed}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            isNextAllowed
              ? "text-[var(--arc-muted,#8e8eb6)] hover:text-[var(--foreground)]"
              : "opacity-30 cursor-not-allowed text-[var(--arc-muted,#8e8eb6)]",
          )}
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[var(--arc-muted,#8e8eb6)] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const key = `${year}-${month}-${day}`;
          const status = logMap.get(key);
          const cellDate = new Date(year, month - 1, day);
          cellDate.setHours(0, 0, 0, 0);
          const isFuture = cellDate > today;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasNote = noteDates?.has(dateStr) ?? false;
          const clickable = !!onDayClick && !isFuture;

          return (
            <div key={key} className="relative">
              {hasNote && (
                <span
                  className="absolute top-0.5 right-1 text-[8px] leading-none z-10"
                  title="Notitie"
                >
                  📝
                </span>
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onDayClick!(dateStr) : undefined}
                className={cn(
                  "w-full flex flex-col items-center justify-center aspect-square rounded-lg text-center",
                  clickable && "transition-colors hover:brightness-125 active:scale-95 cursor-pointer",
                  !clickable && "cursor-default",
                )}
                style={{
                  background: status ? `${statusColor(status)}22` : "transparent",
                  outline: hasNote ? "1px solid rgba(250,204,21,0.4)" : undefined,
                }}
              >
                {status ? (
                  <span className="text-lg leading-none">{statusEmoji(status)}</span>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isFuture
                        ? "text-transparent"
                        : "text-[var(--arc-muted,#8e8eb6)]",
                    )}
                  >
                    {day}
                  </span>
                )}
                {status && (
                  <span className="text-[9px] text-[var(--arc-muted,#8e8eb6)] leading-none mt-0.5">
                    {day}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        <span className="text-xs text-[var(--arc-muted,#8e8eb6)] flex items-center gap-1">⭐ Droog</span>
        <span className="text-xs text-[var(--arc-muted,#8e8eb6)] flex items-center gap-1">🌟 Droog+</span>
        <span className="text-xs text-[var(--arc-muted,#8e8eb6)] flex items-center gap-1">💧 Nat</span>
      </div>
    </div>
  );
}

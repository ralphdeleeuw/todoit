"use client";

import { format, subMonths, startOfMonth, eachMonthOfInterval } from "date-fns";
import { nl } from "date-fns/locale";

interface RecurrenceHistoryProps {
  history: Array<{ id: string; completedAt: string }>;
}

export function RecurrenceHistory({ history }: RecurrenceHistoryProps) {
  const completedDates = history.map((h) => new Date(h.completedAt));

  const now = new Date();
  const monthStart = startOfMonth(subMonths(now, 5));
  const months = eachMonthOfInterval({ start: monthStart, end: startOfMonth(now) });

  const completedByMonth: Record<string, number> = {};
  for (const d of completedDates) {
    const key = format(d, "yyyy-MM");
    completedByMonth[key] = (completedByMonth[key] ?? 0) + 1;
  }

  const maxCount = Math.max(...Object.values(completedByMonth), 1);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
        Herhalingshistorie {history.length > 0 ? `· ${history.length}× voltooid` : "· nog niet voltooid"}
      </p>

      {history.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">Nog geen voltooiingen geregistreerd.</p>
      ) : (
        <>
          <div className="flex items-end gap-1.5 h-14 mb-1">
            {months.map((m) => {
              const key = format(m, "yyyy-MM");
              const count = completedByMonth[key] ?? 0;
              const pct = count / maxCount;
              const barH = Math.max(pct * 48, count > 0 ? 4 : 0);
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex items-end justify-center">
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${barH}px`,
                        background: count > 0 ? "linear-gradient(to top, #6366f1, #818cf8)" : "transparent",
                      }}
                    />
                  </div>
                  {count > 0 && (
                    <span className="text-[9px] font-bold" style={{ color: "#6366f1" }}>{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1.5">
            {months.map((m) => (
              <div key={format(m, "yyyy-MM")} className="flex-1 text-center">
                <span className="text-[9px] text-gray-400 dark:text-gray-500">
                  {format(m, "MMM", { locale: nl })}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {completedDates.map((d, i) => (
              <div
                key={i}
                title={format(d, "d MMMM yyyy", { locale: nl })}
                className="w-2 h-2 rounded-full"
                style={{ background: "#6366f1", opacity: 0.7 + 0.3 * (i / Math.max(completedDates.length - 1, 1)) }}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            Eerste: {format(completedDates[0], "d MMM yyyy", { locale: nl })} ·{" "}
            Laatste: {format(completedDates[completedDates.length - 1], "d MMM yyyy", { locale: nl })}
          </p>
        </>
      )}
    </div>
  );
}

"use client";

interface DayData {
  key: string;
  label: string;
  count: number;
}

interface Props {
  days: DayData[];
  color: string;
}

export function CompletedTasksChart({ days, color }: Props) {
  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const total = days.reduce((s, d) => s + d.count, 0);

  // Show only every 5th label to avoid crowding
  const labelStep = 5;

  return (
    <div
      className="rounded-[22px] p-4"
      style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)]">
          Taken afgevinkt · afgelopen 30 dagen
        </p>
        <span className="text-xs font-black tabular-nums" style={{ color }}>
          {total}×
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-px" style={{ height: 56 }}>
        {days.map((day) => {
          const pct = day.count / maxCount;
          const barH = Math.max(pct * 48, day.count > 0 ? 3 : 0);
          return (
            <div
              key={day.key}
              className="flex-1 flex flex-col justify-end"
              style={{ height: 48 }}
              title={`${day.label}: ${day.count} taak${day.count !== 1 ? "en" : ""}`}
            >
              <div
                className="w-full rounded-t-[2px] transition-all"
                style={{
                  height: `${barH}px`,
                  background: day.count > 0
                    ? `linear-gradient(to top, ${color}, ${color}99)`
                    : `${color}15`,
                  minHeight: day.count === 0 ? 2 : undefined,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis: show label every 5 days */}
      <div className="flex gap-px mt-1">
        {days.map((day, i) => (
          <div key={day.key} className="flex-1 text-center">
            {i % labelStep === 0 ? (
              <span className="text-[8px] text-[var(--arc-muted-deep)]">{day.label}</span>
            ) : null}
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="text-[10px] text-[var(--arc-muted)] text-center mt-2 italic">
          Nog geen taken voltooid in deze periode
        </p>
      )}
    </div>
  );
}

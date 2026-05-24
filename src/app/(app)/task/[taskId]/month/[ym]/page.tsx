import { notFound } from "next/navigation";
import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";
import { BackButton } from "./BackButton";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ taskId: string; ym: string }> };

export default async function TaskMonthPage({ params }: Params) {
  const { taskId, ym } = await params;
  const session = await verifyFamily();

  const task = await prisma.task.findFirst({
    where: { id: taskId, familyId: session.familyId },
    select: { id: true, title: true },
  });
  if (!task) notFound();

  const parts = ym.split("-");
  if (parts.length !== 2) notFound();
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) notFound();

  const monthDate = new Date(year, monthIdx, 1);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });

  const history = await prisma.$queryRaw<Array<{ id: string; completedAt: Date }>>`
    WITH RECURSIVE chain AS (
      SELECT id, "completedAt", "parentTaskId"
      FROM "Task"
      WHERE id = ${taskId}
      UNION ALL
      SELECT t.id, t."completedAt", t."parentTaskId"
      FROM "Task" t
      INNER JOIN chain c ON t.id = c."parentTaskId"
    )
    SELECT id, "completedAt"
    FROM chain
    WHERE "completedAt" IS NOT NULL
    ORDER BY "completedAt" ASC
  `;

  const completedDayKeys = new Set(
    history.map((h) => format(new Date(h.completedAt), "yyyy-MM-dd"))
  );

  // Monday-first offset: Mon=0 ... Sun=6
  const firstDayOffset = (getDay(start) + 6) % 7;

  const emoji = task.title.match(/^\p{Emoji}/u)?.[0] ?? "📋";
  const titleText = task.title.replace(/^\p{Emoji}\s*/u, "");
  const monthName = format(monthDate, "MMMM yyyy", { locale: nl });

  const completedInMonth = history.filter((h) => {
    const d = new Date(h.completedAt);
    return d >= start && d <= end;
  });

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        <BackButton />
        <h1 className="text-lg font-black text-white">Taakhistorie</h1>
      </header>

      {/* Task hero */}
      <div
        className="mx-4 mt-2 mb-4 rounded-2xl p-4"
        style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "#6366f122", border: "1px solid #6366f133" }}
          >
            {emoji}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-white">{titleText}</p>
            <p className="text-xs text-[var(--arc-muted)] capitalize">{monthName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black tabular-nums" style={{ color: "#818cf8" }}>
              {completedInMonth.length}
            </p>
            <p className="text-[10px] text-[var(--arc-muted)]">keer voltooid</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div
        className="mx-4 rounded-2xl p-4"
        style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border)" }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-[var(--arc-muted)] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const done = completedDayKeys.has(key);
            return (
              <div
                key={key}
                className="aspect-square flex items-center justify-center rounded-xl text-sm"
                style={
                  done
                    ? {
                        background: "linear-gradient(135deg, #6366f1, #818cf8)",
                        color: "white",
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
                      }
                    : { color: "var(--arc-muted)" }
                }
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>

        {completedInMonth.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--arc-border)" }}>
            <p className="text-[11px] text-[var(--arc-muted)]">
              Voltooid op:{" "}
              <span className="text-white font-medium">
                {completedInMonth
                  .map((h) => format(new Date(h.completedAt), "d MMM", { locale: nl }))
                  .join(", ")}
              </span>
            </p>
          </div>
        )}

        {completedInMonth.length === 0 && (
          <p className="text-xs text-[var(--arc-muted)] mt-3 text-center italic">
            Niet voltooid in {format(monthDate, "MMMM", { locale: nl })}
          </p>
        )}
      </div>

      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}

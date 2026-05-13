import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { calcLevel } from "@/lib/arcade";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Achievements – Todoit" };
export const dynamic = "force-dynamic";

type Badge = {
  id: string;
  label: string;
  sub: string;
  icon: string;
  color: string;
  section: string;
  check: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => number; // 0-100
};

type UserStats = {
  totalCompleted: number;
  weekCompleted: number;
  streak: number;
  level: number;
  totalXp: number;
};

const BADGES: Badge[] = [
  // Schoonmaak
  { id: "first", label: "Eerste stap", sub: "Eerste taak voltooid", icon: "🎯", color: "#6366f1", section: "Schoonmaak",
    check: (s) => s.totalCompleted >= 1, progress: (s) => Math.min(100, s.totalCompleted * 100) },
  { id: "clean10", label: "Poetskoning", sub: "10 taken voltooid", icon: "🧹", color: "#6366f1", section: "Schoonmaak",
    check: (s) => s.totalCompleted >= 10, progress: (s) => Math.min(100, (s.totalCompleted / 10) * 100) },
  { id: "clean50", label: "Schoonmaakheld", sub: "50 taken voltooid", icon: "✨", color: "#8b5cf6", section: "Schoonmaak",
    check: (s) => s.totalCompleted >= 50, progress: (s) => Math.min(100, (s.totalCompleted / 50) * 100) },
  // Streaks
  { id: "streak3", label: "Op dreef", sub: "3 dagen op rij", icon: "🔥", color: "#f97316", section: "Streaks",
    check: (s) => s.streak >= 3, progress: (s) => Math.min(100, (s.streak / 3) * 100) },
  { id: "streak7", label: "Weekkampioen", sub: "7 dagen op rij", icon: "🏆", color: "#facc15", section: "Streaks",
    check: (s) => s.streak >= 7, progress: (s) => Math.min(100, (s.streak / 7) * 100) },
  { id: "streak30", label: "Legendarisch", sub: "30 dagen op rij", icon: "⚡", color: "#ef4444", section: "Streaks",
    check: (s) => s.streak >= 30, progress: (s) => Math.min(100, (s.streak / 30) * 100) },
  // Combo & XP
  { id: "xp100", label: "XP Starter", sub: "100 XP verzameld", icon: "💎", color: "#06d6c4", section: "Combo & XP",
    check: (s) => s.totalXp >= 100, progress: (s) => Math.min(100, (s.totalXp / 100) * 100) },
  { id: "xp500", label: "XP Meester", sub: "500 XP verzameld", icon: "🌟", color: "#06d6c4", section: "Combo & XP",
    check: (s) => s.totalXp >= 500, progress: (s) => Math.min(100, (s.totalXp / 500) * 100) },
  { id: "level3", label: "Klusbaas 3", sub: "Level 3 bereikt", icon: "🎖️", color: "#facc15", section: "Combo & XP",
    check: (s) => s.level >= 3, progress: (s) => Math.min(100, ((s.level - 1) / 2) * 100) },
  // Speciaal
  { id: "week5", label: "Weekwarrior", sub: "5 taken in één week", icon: "💪", color: "#10b981", section: "Speciaal",
    check: (s) => s.weekCompleted >= 5, progress: (s) => Math.min(100, (s.weekCompleted / 5) * 100) },
  { id: "week15", label: "Onstopbaar", sub: "15 taken in één week", icon: "🚀", color: "#10b981", section: "Speciaal",
    check: (s) => s.weekCompleted >= 15, progress: (s) => Math.min(100, (s.weekCompleted / 15) * 100) },
];

const SECTIONS = ["Schoonmaak", "Streaks", "Combo & XP", "Speciaal"];

export default async function AchievementsPage() {
  const session = await verifyFamily();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [user, totalCompleted, weekCompleted] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { xp: true, streak: true },
    }),
    prisma.task.count({
      where: { assigneeId: session.id, familyId: session.familyId, completedAt: { not: null } },
    }),
    prisma.task.count({
      where: { assigneeId: session.id, familyId: session.familyId, completedAt: { gte: weekAgo } },
    }),
  ]);

  const stats: UserStats = {
    totalCompleted,
    weekCompleted,
    streak: user?.streak ?? 0,
    level: calcLevel(user?.xp ?? 0),
    totalXp: user?.xp ?? 0,
  };

  const earned = BADGES.filter((b) => b.check(stats)).length;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-4">
        <Link href="/score" className="p-2 rounded-xl text-[var(--arc-muted)] hover:text-white" style={{ background: "var(--arc-panel)" }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Achievements</h1>
          <p className="text-[10px] text-[var(--arc-muted)]">{earned} / {BADGES.length} behaald</p>
        </div>
      </header>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const sectionBadges = BADGES.filter((b) => b.section === section);
        return (
          <div key={section} className="px-4 mb-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-3">
              {section}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {sectionBadges.map((badge) => {
                const done = badge.check(stats);
                const prog = badge.progress(stats);
                return (
                  <div
                    key={badge.id}
                    className="p-4 rounded-2xl flex flex-col gap-2"
                    style={
                      done
                        ? { background: `${badge.color}22`, border: `1.5px solid ${badge.color}55` }
                        : { background: "var(--arc-panel)", border: "1px solid var(--arc-border)", filter: "grayscale(0.6)" }
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={done ? { background: `${badge.color}33` } : { background: "var(--arc-panel-2)" }}
                      >
                        {badge.icon}
                      </div>
                      {done && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                          style={{ background: badge.color }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${done ? "text-white" : "text-[var(--arc-muted)]"}`}>
                        {badge.label}
                      </p>
                      <p className="text-[10px] text-[var(--arc-muted-deep)]">{badge.sub}</p>
                    </div>
                    {!done && (
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${prog}%`, background: badge.color }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}

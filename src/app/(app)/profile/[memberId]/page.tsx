import { notFound, redirect } from "next/navigation";
import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { calcLevel, xpIntoCurrentLevel } from "@/lib/arcade";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const PILL_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

type Params = { params: Promise<{ memberId: string }> };

export default async function ProfilePage({ params }: Params) {
  const { memberId } = await params;
  const session = await verifyFamily();

  const [member, allMembers] = await Promise.all([
    prisma.user.findFirst({
      where: { id: memberId, familyId: session.familyId },
      select: {
        id: true, name: true, email: true, image: true, role: true,
        xp: true, weekXp: true, streak: true,
        assignedTasks: {
          where: { completedAt: { not: null } },
          orderBy: { completedAt: "desc" },
          take: 5,
          include: { list: { select: { name: true, color: true, points: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { familyId: session.familyId },
      select: { id: true, weekXp: true },
      orderBy: { weekXp: "desc" },
    }),
  ]);

  if (!member) notFound();

  const level = calcLevel(member.xp);
  const xpIn = xpIntoCurrentLevel(member.xp);
  const pct = Math.round((xpIn / 500) * 100);
  const weekRank = allMembers.findIndex((m) => m.id === memberId) + 1;
  const colorIdx = allMembers.findIndex((m) => m.id === memberId);
  const color = PILL_COLORS[colorIdx % PILL_COLORS.length];
  const initial = (member.name ?? "?")[0].toUpperCase();

  const stats = [
    { label: "XP deze week", value: member.weekXp, icon: "⚡", color: "#6366f1" },
    { label: "Totaal XP",    value: member.xp,     icon: "💎", color: "#f59e0b" },
    { label: "Streak",       value: `${member.streak}d`, icon: "🔥", color: "#ef4444" },
    { label: "Badges",       value: level,          icon: "🏅", color: "#10b981" },
  ];

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {/* Back header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href="/family" className="p-2 rounded-xl text-[var(--arc-muted)] hover:text-white transition-colors" style={{ background: "var(--arc-panel)" }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-black text-white">Profiel</h1>
      </header>

      {/* Hero card */}
      <div
        className="mx-4 mt-2 mb-4 rounded-[22px] p-5"
        style={{
          background: `linear-gradient(135deg, ${color}33, var(--arc-panel))`,
          border: `1.5px solid ${color}55`,
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl text-white overflow-hidden border-4"
              style={{ background: color, borderColor: color, boxShadow: `0 0 24px ${color}66` }}
            >
              {member.image
                ? <img src={member.image} alt="" className="w-full h-full object-cover rounded-full" />
                : initial
              }
            </div>
            <div
              className="absolute -bottom-1 -right-1 text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)", color: "#1a1000", lineHeight: 1.4 }}
            >
              LV {level}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xl font-black text-white">{member.name ?? "Naamloos"}</p>
            <p className="text-xs text-[var(--arc-muted)] mt-0.5">
              #{weekRank} deze week · {member.role === "PARENT" ? "Ouder" : "Kind"}
            </p>
          </div>
        </div>

        {/* XP bar */}
        <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: `linear-gradient(to right, var(--xp-accent), var(--gold))` }}
          />
        </div>
        <p className="text-[10px] text-[var(--arc-muted)] tabular-nums">{xpIn} / 500 XP naar level {level + 1}</p>
      </div>

      {/* Stats grid */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-2xl"
            style={{ background: `${s.color}12`, border: `1px solid ${s.color}33` }}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-black text-white tabular-nums">{s.value}</div>
            <div className="text-[10px] text-[var(--arc-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent completed */}
      {member.assignedTasks.length > 0 && (
        <div className="px-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">
            Recent voltooid
          </p>
          <div className="space-y-2">
            {member.assignedTasks.map((task) => {
              const taskColor = task.list?.color ?? color;
              const completedStr = task.completedAt
                ? new Date(task.completedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
                : "";
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border)" }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${taskColor}22` }}
                  >
                    {task.title.match(/^\p{Emoji}/u)?.[0] ?? "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate line-through opacity-70">
                      {task.title.replace(/^\p{Emoji}\s*/u, "")}
                    </p>
                    {task.list && <p className="text-[10px] text-[var(--arc-muted)]">{task.list.name}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-bold" style={{ color: "var(--gold)" }}>💎 {task.list?.points ?? 0}</div>
                    <div className="text-[9px] text-[var(--arc-muted-deep)]">{completedStr}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}

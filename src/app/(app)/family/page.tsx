import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { calcLevel, xpIntoCurrentLevel } from "@/lib/arcade";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";
import { InviteButton } from "./InviteButton";
import { RoleToggle } from "./RoleToggle";
import Link from "next/link";

export const metadata = { title: "Squad – Todoit" };
export const dynamic = "force-dynamic";

const PILL_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

export default async function FamilyPage() {
  const session = await verifyFamily();
  const isParent = session.role === "PARENT";
  const familyId = session.familyId;

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: {
        select: {
          id: true, name: true, email: true, image: true, role: true,
          xp: true, weekXp: true, streak: true,
          _count: { select: { assignedTasks: { where: { completedAt: null } } } },
        },
        orderBy: { weekXp: "desc" },
      },
    },
  });

  if (!family) redirect("/onboarding");

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--arc-muted)] uppercase">TODOIT</p>
          <h1 className="text-xl font-black text-white tracking-tight">Squad</h1>
        </div>
        {isParent && (
          <InviteButton />
        )}
      </header>

      {/* Member cards */}
      <div className="px-4 space-y-3">
        {family.members.map((member, i) => {
          const color = PILL_COLORS[i % PILL_COLORS.length];
          const level = calcLevel(member.xp);
          const xpIn = xpIntoCurrentLevel(member.xp);
          const pct = Math.round((xpIn / 500) * 100);
          const initial = (member.name ?? member.email ?? "?")[0].toUpperCase();

          return (
            <Link
              key={member.id}
              href={`/profile/${member.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[.98]"
              style={{
                background: `linear-gradient(135deg, ${color}18, var(--arc-panel))`,
                border: `1.5px solid ${color}33`,
              }}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white overflow-hidden"
                  style={{ background: color, boxShadow: `0 0 16px ${color}55` }}
                >
                  {member.image
                    ? <img src={member.image} alt="" className="w-full h-full object-cover rounded-full" />
                    : <span className="text-xl">{initial}</span>
                  }
                </div>
                <div
                  className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)", color: "#1a1000", lineHeight: 1 }}
                >
                  LV{level}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm truncate">{member.name ?? "Naamloos"}</span>
                  {isParent && member.id !== session.id && (
                    <RoleToggle userId={member.id} currentRole={member.role} />
                  )}
                </div>
                {/* Mini XP bar */}
                <div className="h-1.5 rounded-full mb-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: `linear-gradient(to right, var(--xp-accent), ${color})` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--arc-muted)]">
                  {member.streak > 0 && <span>🔥 {member.streak} streak</span>}
                  <span>💎 {member.weekXp} week XP</span>
                </div>
              </div>

              {/* Task count */}
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-white tabular-nums">{member._count.assignedTasks}</div>
                <div className="text-[10px] text-[var(--arc-muted)]">taken</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}

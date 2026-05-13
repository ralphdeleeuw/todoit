import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { LeaderboardClient } from "./LeaderboardClient";
import { calcLevel } from "@/lib/arcade";

export const metadata = { title: "Top 4 – Todoit" };
export const dynamic = "force-dynamic";

export default async function ScorePage() {
  const session = await verifyFamily();

  const members = await prisma.user.findMany({
    where: { familyId: session.familyId },
    select: { id: true, name: true, image: true, role: true, xp: true, weekXp: true, streak: true },
    orderBy: { weekXp: "desc" },
  });

  // Last 7 days daily XP per member — from recently completed tasks
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentTasks = await prisma.task.findMany({
    where: {
      familyId: session.familyId,
      completedAt: { gte: sevenDaysAgo },
      assigneeId: { not: null },
    },
    select: { assigneeId: true, completedAt: true, list: { select: { points: true } } },
  });

  // Build 7-day history: [{ date, perMember: { [memberId]: xp } }]
  const days: { label: string; data: Record<string, number> }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("nl-NL", { weekday: "short" });
    const data: Record<string, number> = {};
    for (const t of recentTasks) {
      if (!t.completedAt || !t.assigneeId) continue;
      const td = new Date(t.completedAt);
      td.setHours(0, 0, 0, 0);
      if (td.getTime() === d.getTime()) {
        data[t.assigneeId] = (data[t.assigneeId] ?? 0) + (t.list?.points ?? 0);
      }
    }
    days.push({ label, data });
  }

  const enriched = members.map((m) => ({ ...m, level: calcLevel(m.xp) }));

  return (
    <LeaderboardClient
      members={enriched}
      currentUserId={session.id}
      days={days}
    />
  );
}

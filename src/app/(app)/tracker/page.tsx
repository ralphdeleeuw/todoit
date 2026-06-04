import { notFound } from "next/navigation";
import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { canAccessTracker } from "@/lib/permissions";
import { computeNightStats } from "@/lib/nightlog";
import { TrackerClient } from "./TrackerClient";
import type { NightStatus } from "@prisma/client";

export const metadata = { title: "Mijn Nachten – Todoit" };
export const dynamic = "force-dynamic";

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await verifyFamily();
  const { child } = await searchParams;

  const targetId = child ?? session.id;

  // Resolve target user's familyId + trackerEnabled
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { familyId: true, trackerEnabled: true },
  });

  const viewer = {
    id: session.id,
    familyId: session.familyId,
    role: (session.role ?? "CHILD") as import("@prisma/client").FamilyRole,
  };

  if (
    !targetUser?.familyId ||
    !canAccessTracker(viewer, targetId, targetUser.familyId)
  ) {
    return notFound();
  }

  // Parents can always access; children need trackerEnabled or it's their own profile
  if (viewer.role !== "PARENT" && !targetUser.trackerEnabled) {
    return notFound();
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const [allLogs, monthLogs, activeGoal] = await Promise.all([
    prisma.nightLog.findMany({
      where: { userId: targetId },
      orderBy: { date: "asc" },
    }),
    prisma.nightLog.findMany({
      where: {
        userId: targetId,
        date: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { date: "asc" },
    }),
    prisma.rewardGoal.findFirst({
      where: { userId: targetId, active: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = computeNightStats(allLogs);

  const totalPoints = stats.totalPoints;
  const goalProgress = activeGoal
    ? Math.max(0, totalPoints - activeGoal.baselinePoints)
    : null;

  // Today's log (if any)
  const todayStart = new Date(year, month - 1, now.getDate());
  todayStart.setHours(0, 0, 0, 0);
  const todayLog = allLogs.find((l) => {
    const d = new Date(l.date);
    return d.getUTCFullYear() === year &&
      d.getUTCMonth() + 1 === month &&
      d.getUTCDate() === now.getDate();
  });

  const initialData = JSON.parse(
    JSON.stringify({
      logs: monthLogs,
      stats,
      activeGoal: activeGoal
        ? { ...activeGoal, progress: goalProgress }
        : null,
    }),
  );

  return (
    <TrackerClient
      childId={targetId}
      initialData={initialData}
      initialYear={year}
      initialMonth={month}
      todayStatus={(todayLog?.status ?? null) as NightStatus | null}
    />
  );
}

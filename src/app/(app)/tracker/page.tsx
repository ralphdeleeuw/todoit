import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { canAccessTracker } from "@/lib/permissions";
import { computeNightStats } from "@/lib/nightlog";
import { TrackerClient } from "./TrackerClient";
import type { FamilyRole, NightStatus } from "@prisma/client";

export const metadata = { title: "Mijn Nachten – Todoit" };
export const dynamic = "force-dynamic";

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await verifyFamily();
  const { child } = await searchParams;

  const viewer = {
    id: session.id,
    familyId: session.familyId,
    role: (session.role ?? "CHILD") as FamilyRole,
  };
  const isParent = viewer.role === "PARENT";

  // Parents can browse the tracker of any tracked child in the family.
  const trackedChildren = isParent
    ? await prisma.user.findMany({
        where: { familyId: session.familyId, trackerEnabled: true },
        select: { id: true, name: true, image: true },
        orderBy: { name: "asc" },
      })
    : [];

  // Resolve which user's tracker to show.
  // - explicit ?child= wins
  // - parents default to the first tracked child (their own tracker is usually empty)
  // - children always see their own
  let targetId = session.id;
  if (child) {
    targetId = child;
  } else if (isParent && trackedChildren.length > 0) {
    targetId = trackedChildren[0].id;
  }

  // Parent opened the tracker but no child has it enabled yet — friendly hint.
  if (isParent && trackedChildren.length === 0 && !child) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center space-y-3">
        <p className="text-4xl">🌙</p>
        <h1 className="text-xl font-bold">Nacht-tracker</h1>
        <p className="text-sm text-[var(--arc-muted,#8e8eb6)]">
          Er is nog geen kind met de nacht-tracker aan. Zet de tracker aan bij
          een kind via Instellingen.
        </p>
        <Link
          href="/settings"
          className="inline-block mt-2 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: "var(--gold,#facc15)", color: "#1a1a1a" }}
        >
          Naar Instellingen
        </Link>
      </div>
    );
  }

  // Resolve target user's familyId + trackerEnabled + name
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { familyId: true, trackerEnabled: true, name: true },
  });

  if (
    !targetUser?.familyId ||
    !canAccessTracker(viewer, targetId, targetUser.familyId)
  ) {
    return notFound();
  }

  // Children need trackerEnabled on their own profile; parents always pass.
  if (!isParent && !targetUser.trackerEnabled) {
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

  // When a parent views a child, the UI reads "Nachten van <naam>".
  const viewingOwn = targetId === session.id;
  const viewingName = viewingOwn ? null : targetUser.name ?? "Kind";

  return (
    <TrackerClient
      childId={targetId}
      initialData={initialData}
      initialYear={year}
      initialMonth={month}
      todayStatus={(todayLog?.status ?? null) as NightStatus | null}
      isParentView={isParent && !viewingOwn}
      viewingName={viewingName}
      trackedChildren={trackedChildren.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canAccessTracker } from "@/lib/permissions";
import { awardXp } from "@/lib/xp";
import { NIGHT_POINTS } from "@/lib/arcade";
import { computeNightStats } from "@/lib/nightlog";
import type { NightStatus } from "@prisma/client";

/** GET /api/nightlog?month=YYYY-MM&child=<id?> */
export async function GET(req: Request) {
  try {
    const user = await requireFamily();
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child");
    const month = searchParams.get("month"); // YYYY-MM

    const targetId = childId ?? user.id;

    // Resolve the target user's familyId for the permission check
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { familyId: true, trackerStartDate: true },
    });
    if (
      !targetUser?.familyId ||
      !canAccessTracker(user, targetId, targetUser.familyId)
    ) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    // Fetch all logs to compute stats, plus filter by month for calendar
    const allLogs = await prisma.nightLog.findMany({
      where: { userId: targetId },
      orderBy: { date: "asc" },
    });

    const stats = computeNightStats(allLogs, targetUser.trackerStartDate);

    let monthLogs = allLogs;
    if (month) {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      monthLogs = allLogs.filter((l) => {
        const d = new Date(l.date);
        return d >= start && d < end;
      });
    }

    // Active reward goal with computed progress
    const activeGoal = await prisma.rewardGoal.findFirst({
      where: { userId: targetId, active: true },
      orderBy: { createdAt: "desc" },
    });
    const goalProgress = activeGoal
      ? Math.max(0, stats.totalPoints - activeGoal.baselinePoints)
      : null;

    return NextResponse.json({
      logs: monthLogs,
      stats,
      activeGoal: activeGoal
        ? { ...activeGoal, progress: goalProgress }
        : null,
    });
  } catch (e) {
    return apiError(e);
  }
}

/** PUT /api/nightlog — upsert a single night entry */
export async function PUT(req: Request) {
  try {
    const user = await requireFamily();
    const body = await req.json();
    const { date, status, child } = body as {
      date: string;
      status: NightStatus;
      child?: string;
    };

    if (!date || !status) {
      return NextResponse.json({ error: "date en status zijn verplicht" }, { status: 400 });
    }
    if (!["DRY", "DRY_MEDS", "WET", "WET_MEDS"].includes(status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }

    const targetId = child ?? user.id;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { familyId: true, trackerStartDate: true },
    });
    if (
      !targetUser?.familyId ||
      !canAccessTracker(user, targetId, targetUser.familyId)
    ) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    // Normalize date to midnight UTC to match @db.Date storage
    const logDate = new Date(date + "T00:00:00.000Z");

    // Nights before the fresh-start date stay on the calendar but earn no XP.
    const startDate = targetUser.trackerStartDate;
    const countsForScore =
      !startDate ||
      logDate.toISOString().slice(0, 10) >=
        new Date(startDate).toISOString().slice(0, 10);

    // Read existing entry to compute XP delta
    const existing = await prisma.nightLog.findUnique({
      where: { userId_date: { userId: targetId, date: logDate } },
    });
    const prevPoints = existing?.points ?? 0;
    const newPoints = NIGHT_POINTS[status];
    const delta = newPoints - prevPoints;

    // Upsert the log entry
    const log = await prisma.nightLog.upsert({
      where: { userId_date: { userId: targetId, date: logDate } },
      create: {
        userId: targetId,
        date: logDate,
        status,
        points: newPoints,
      },
      update: {
        status,
        points: newPoints,
      },
    });

    // Apply XP delta if it changed (only for nights on/after the fresh-start date)
    let xpResult = null;
    if (delta !== 0 && countsForScore) {
      xpResult = await awardXp(targetId, delta, { touchStreak: delta > 0 });
    }

    // Return updated stats
    const allLogs = await prisma.nightLog.findMany({
      where: { userId: targetId },
      orderBy: { date: "asc" },
    });
    const stats = computeNightStats(allLogs, startDate);

    const activeGoal = await prisma.rewardGoal.findFirst({
      where: { userId: targetId, active: true },
      orderBy: { createdAt: "desc" },
    });
    const goalProgress = activeGoal
      ? Math.max(0, stats.totalPoints - activeGoal.baselinePoints)
      : null;

    return NextResponse.json({
      log,
      stats,
      activeGoal: activeGoal ? { ...activeGoal, progress: goalProgress } : null,
      xp: xpResult,
    });
  } catch (e) {
    return apiError(e);
  }
}

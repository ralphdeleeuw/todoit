import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canAccessTracker } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const user = await requireFamily();
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child");
    const targetId = childId ?? user.id;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { familyId: true },
    });
    if (
      !targetUser?.familyId ||
      !canAccessTracker(user, targetId, targetUser.familyId)
    ) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const [goals, logs] = await Promise.all([
      prisma.rewardGoal.findMany({
        where: { userId: targetId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.nightLog.findMany({
        where: { userId: targetId },
        select: { points: true },
      }),
    ]);

    const totalPoints = logs.reduce((s, l) => s + l.points, 0);
    const enriched = goals.map((g) => ({
      ...g,
      progress: Math.max(0, totalPoints - g.baselinePoints),
    }));

    return NextResponse.json({ goals: enriched, totalPoints });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFamily();
    const body = await req.json();
    const { title, emoji, targetPoints, child } = body as {
      title: string;
      emoji?: string;
      targetPoints: number;
      child?: string;
    };

    if (!title || !targetPoints || targetPoints <= 0) {
      return NextResponse.json({ error: "Titel en doel zijn verplicht" }, { status: 400 });
    }

    const targetId = child ?? user.id;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { familyId: true },
    });
    if (
      !targetUser?.familyId ||
      !canAccessTracker(user, targetId, targetUser.familyId)
    ) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    // Baseline = current total points so progress starts at 0
    const logs = await prisma.nightLog.findMany({
      where: { userId: targetId },
      select: { points: true },
    });
    const baselinePoints = logs.reduce((s, l) => s + l.points, 0);

    // Deactivate existing active goals
    await prisma.rewardGoal.updateMany({
      where: { userId: targetId, active: true },
      data: { active: false },
    });

    const goal = await prisma.rewardGoal.create({
      data: {
        userId: targetId,
        title,
        emoji: emoji ?? null,
        targetPoints,
        baselinePoints,
        active: true,
      },
    });

    return NextResponse.json({ ...goal, progress: 0 });
  } catch (e) {
    return apiError(e);
  }
}

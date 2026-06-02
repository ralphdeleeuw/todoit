import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canEditTask } from "@/lib/permissions";
import { completeTaskAndSpawnNext } from "@/lib/recurrence";
import { calcLevel, levelDidCross } from "@/lib/arcade";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { taskId } = await ctx.params;
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || !canEditTask(user, existing)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.completedAt) {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    let permanent = false;
    try {
      const body = await req.json();
      permanent = !!body?.permanent;
    } catch {
      // no body or not JSON
    }

    // Award XP to the assignee, not the person who ticked the box
    const recipientId = existing.assigneeId ?? user.id;

    // Completion (incl. recurrence spawn) and the recipient's current XP/streak
    // are independent once the recipient is known — run them concurrently.
    const [result, dbUser] = await Promise.all([
      completeTaskAndSpawnNext(taskId, user.id, permanent),
      prisma.user.findUnique({ where: { id: recipientId } }),
    ]);
    const points = result.points;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevXp = dbUser?.xp ?? 0;
    const prevStreak = dbUser?.streak ?? 0;
    const lastActivity = dbUser?.lastActivityDate
      ? new Date(dbUser.lastActivityDate)
      : null;
    lastActivity?.setHours(0, 0, 0, 0);

    const lastActivityTime = lastActivity?.getTime();
    const todayTime = today.getTime();
    const yesterdayTime = todayTime - 86_400_000;

    let newStreak: number;
    if (!lastActivity) {
      newStreak = 1;
    } else if (lastActivityTime === todayTime) {
      newStreak = prevStreak; // already counted today
    } else if (lastActivityTime === yesterdayTime) {
      newStreak = prevStreak + 1; // consecutive day
    } else {
      newStreak = 1; // streak broken
    }

    const updatedUser = await prisma.user.update({
      where: { id: recipientId },
      data: {
        xp: { increment: points },
        weekXp: { increment: points },
        streak: newStreak,
        lastActivityDate: new Date(),
      },
    });

    const newXp = updatedUser.xp;
    const levelUp = levelDidCross(prevXp, newXp);
    const newLevel = calcLevel(newXp);

    return NextResponse.json({
      ...result,
      xp: newXp,
      weekXp: updatedUser.weekXp,
      streak: updatedUser.streak,
      levelUp,
      newLevel,
    });
  } catch (e) {
    return apiError(e);
  }
}

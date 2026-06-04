import { prisma } from "@/lib/prisma";
import { calcLevel, levelDidCross } from "@/lib/arcade";

export type XpResult = {
  xp: number;
  weekXp: number;
  streak: number;
  levelUp: boolean;
  newLevel: number;
};

/**
 * Awards (or deducts, if points is negative) XP + weekXp and optionally
 * recomputes the activity streak. Mirrors the logic in complete/route.ts.
 * On negative points, xp and weekXp are clamped at 0.
 */
export async function awardXp(
  userId: string,
  points: number,
  opts?: { touchStreak?: boolean },
): Promise<XpResult> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, weekXp: true, streak: true, lastActivityDate: true },
  });

  const prevXp = dbUser?.xp ?? 0;
  const prevStreak = dbUser?.streak ?? 0;

  let streakUpdate: { streak?: number; lastActivityDate?: Date } = {};

  if (opts?.touchStreak) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = dbUser?.lastActivityDate
      ? new Date(dbUser.lastActivityDate)
      : null;
    lastActivity?.setHours(0, 0, 0, 0);

    const todayTime = today.getTime();
    const yesterdayTime = todayTime - 86_400_000;
    const lastActivityTime = lastActivity?.getTime();

    let newStreak: number;
    if (!lastActivity) {
      newStreak = 1;
    } else if (lastActivityTime === todayTime) {
      newStreak = prevStreak;
    } else if (lastActivityTime === yesterdayTime) {
      newStreak = prevStreak + 1;
    } else {
      newStreak = 1;
    }
    streakUpdate = { streak: newStreak, lastActivityDate: new Date() };
  }

  if (points < 0) {
    // Two-step: read current values, then clamp-and-set
    const currentXp = prevXp;
    const currentWeekXp = dbUser?.weekXp ?? 0;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: Math.max(0, currentXp + points),
        weekXp: Math.max(0, currentWeekXp + points),
        ...streakUpdate,
      },
    });
    return {
      xp: updated.xp,
      weekXp: updated.weekXp,
      streak: updated.streak,
      levelUp: false,
      newLevel: calcLevel(updated.xp),
    };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: points },
      weekXp: { increment: points },
      ...streakUpdate,
    },
  });

  const newXp = updated.xp;
  return {
    xp: newXp,
    weekXp: updated.weekXp,
    streak: updated.streak,
    levelUp: levelDidCross(prevXp, newXp),
    newLevel: calcLevel(newXp),
  };
}

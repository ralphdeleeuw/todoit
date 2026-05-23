import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canEditTask } from "@/lib/permissions";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { taskId } = await ctx.params;

    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: { select: { points: true } } },
    });
    if (!existing || !canEditTask(user, existing)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!existing.completedAt) {
      return NextResponse.json({ error: "Not completed" }, { status: 400 });
    }

    const points = existing.list?.points ?? 0;

    await prisma.task.update({
      where: { id: taskId },
      data: { completedAt: null },
    });

    // Remove any unfinished child task that was spawned when this task was completed
    await prisma.task.deleteMany({
      where: { parentTaskId: taskId, completedAt: null },
    });

    // Reverse XP (don't go below 0)
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const currentXp = dbUser?.xp ?? 0;
    const currentWeekXp = dbUser?.weekXp ?? 0;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: Math.max(0, currentXp - points),
        weekXp: Math.max(0, currentWeekXp - points),
      },
    });

    return NextResponse.json({ xp: updatedUser.xp, weekXp: updatedUser.weekXp });
  } catch (e) {
    return apiError(e);
  }
}

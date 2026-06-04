import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canAccessTracker } from "@/lib/permissions";

type Ctx = { params: Promise<{ goalId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { goalId } = await ctx.params;

    const goal = await prisma.rewardGoal.findUnique({ where: { id: goalId } });
    if (!goal) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

    const owner = await prisma.user.findUnique({
      where: { id: goal.userId },
      select: { familyId: true },
    });
    if (
      !owner?.familyId ||
      !canAccessTracker(user, goal.userId, owner.familyId)
    ) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const updated = await prisma.rewardGoal.update({
      where: { id: goalId },
      data: { achievedAt: new Date(), active: false },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

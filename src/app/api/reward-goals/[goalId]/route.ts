import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canAccessTracker } from "@/lib/permissions";

type Ctx = { params: Promise<{ goalId: string }> };

async function getGoalOrDeny(goalId: string, user: { id: string; familyId: string; role: string }) {
  const goal = await prisma.rewardGoal.findUnique({ where: { id: goalId } });
  if (!goal) return null;
  const owner = await prisma.user.findUnique({
    where: { id: goal.userId },
    select: { familyId: true },
  });
  if (!owner?.familyId) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!canAccessTracker(user as any, goal.userId, owner.familyId)) return null;
  return goal;
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { goalId } = await ctx.params;
    const goal = await getGoalOrDeny(goalId, user);
    if (!goal) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

    const body = await req.json();
    const { title, emoji, targetPoints, active } = body;

    const updated = await prisma.rewardGoal.update({
      where: { id: goalId },
      data: {
        ...(title !== undefined && { title }),
        ...(emoji !== undefined && { emoji }),
        ...(targetPoints !== undefined && { targetPoints }),
        ...(active !== undefined && { active }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { goalId } = await ctx.params;
    const goal = await getGoalOrDeny(goalId, user);
    if (!goal) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

    await prisma.rewardGoal.delete({ where: { id: goalId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

/** POST /api/reward-goals/[goalId]/redeem — mark goal achieved */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireFamily();
    const { goalId } = await ctx.params;

    // Support both /[goalId] (PUT) and /[goalId]/redeem via URL check
    const url = new URL(req.url);
    if (!url.pathname.endsWith("/redeem")) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    const goal = await getGoalOrDeny(goalId, user);
    if (!goal) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

    const updated = await prisma.rewardGoal.update({
      where: { id: goalId },
      data: { achievedAt: new Date(), active: false },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { canEditTask } from "@/lib/permissions";
import { completeTaskAndSpawnNext } from "@/lib/recurrence";

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
      // no body or not JSON — treat as normal completion
    }

    const result = await completeTaskAndSpawnNext(taskId, user.id, permanent);
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}

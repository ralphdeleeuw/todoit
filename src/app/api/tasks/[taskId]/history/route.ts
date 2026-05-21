import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireFamily();
    const { taskId } = await params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, familyId: user.familyId },
    });

    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Traverse the recurrence chain upward using a recursive CTE.
    // Each recurring task points to its predecessor via parentTaskId,
    // so we walk up from the current task to collect all completed occurrences.
    const history = await prisma.$queryRaw<
      Array<{ id: string; completedAt: Date; dueDate: Date | null }>
    >`
      WITH RECURSIVE chain AS (
        SELECT id, "completedAt", "dueDate", "parentTaskId"
        FROM "Task"
        WHERE id = ${taskId}

        UNION ALL

        SELECT t.id, t."completedAt", t."dueDate", t."parentTaskId"
        FROM "Task" t
        INNER JOIN chain c ON t.id = c."parentTaskId"
      )
      SELECT id, "completedAt", "dueDate"
      FROM chain
      WHERE "completedAt" IS NOT NULL
      ORDER BY "completedAt" ASC
    `;

    return NextResponse.json(history);
  } catch (e) {
    return apiError(e);
  }
}

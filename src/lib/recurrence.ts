import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import type { Task } from "@prisma/client";

export async function completeTaskAndSpawnNext(
  taskId: string,
  completedByUserId: string,
  permanent = false
): Promise<{ completedTask: Task; nextTask: Task | null }> {
  const completedTask = await prisma.task.update({
    where: { id: taskId },
    data: { completedAt: new Date() },
    include: { labels: true },
  });

  let nextTask: Task | null = null;

  if (!permanent && completedTask.isRecurring && completedTask.recurrenceInterval) {
    const base = completedTask.dueDate ?? completedTask.completedAt!;
    const nextDue = addDays(base, completedTask.recurrenceInterval);

    nextTask = await prisma.task.create({
      data: {
        title: completedTask.title,
        description: completedTask.description,
        dueDate: nextDue,
        familyId: completedTask.familyId,
        listId: completedTask.listId,
        assigneeId: completedTask.assigneeId,
        createdById: completedByUserId,
        isRecurring: true,
        recurrenceInterval: completedTask.recurrenceInterval,
        parentTaskId: completedTask.id,
        labels: {
          create: (completedTask as Task & { labels: { labelId: string }[] }).labels.map(
            (l) => ({ labelId: l.labelId })
          ),
        },
      },
    });

    if (nextTask.assigneeId) {
      await sendPushToUser(nextTask.assigneeId, {
        title: "Nieuwe herhalende taak ingepland",
        body: `"${nextTask.title}" staat gepland voor ${nextDue.toLocaleDateString("nl-NL")}`,
        url: "/dashboard",
      });
    }
  }

  return { completedTask, nextTask };
}

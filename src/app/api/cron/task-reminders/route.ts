import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  // Send reminders for tasks whose reminderAt has passed (up to 25h ago to avoid gaps)
  const since = new Date(now.getTime() - 25 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      completedAt: null,
      reminderAt: { gte: since, lte: now },
      assigneeId: { not: null },
    },
  });

  await Promise.allSettled(
    tasks.map(async (task) => {
      await sendPushToUser(task.assigneeId!, {
        title: "Herinnering",
        body: task.title,
        url: "/dashboard",
      });
      await prisma.task.update({
        where: { id: task.id },
        data: { reminderAt: null },
      });
    })
  );

  return NextResponse.json({ notified: tasks.length });
}

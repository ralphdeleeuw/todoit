import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Find tasks whose reminder is due in the past 5 minutes and not yet sent
  const tasks = await prisma.task.findMany({
    where: {
      completedAt: null,
      reminderAt: { gte: fiveMinutesAgo, lte: now },
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
      // Clear the reminderAt so it won't fire again
      await prisma.task.update({
        where: { id: task.id },
        data: { reminderAt: null },
      });
    })
  );

  return NextResponse.json({ notified: tasks.length });
}

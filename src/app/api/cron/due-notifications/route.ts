import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tomorrow = addDays(new Date(), 1);
  const tasks = await prisma.task.findMany({
    where: {
      completedAt: null,
      dueDate: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) },
      assigneeId: { not: null },
    },
  });

  await Promise.allSettled(
    tasks.map((task) =>
      sendPushToUser(task.assigneeId!, {
        title: "Taak vervalt morgen",
        body: `"${task.title}" moet morgen gedaan zijn`,
        url: "/dashboard",
      })
    )
  );

  return NextResponse.json({ notified: tasks.length });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { dailyReminderEnabled: true, familyId: { not: null } },
    select: { id: true },
  });

  const tomorrow = addDays(new Date(), 1);
  let notified = 0;

  await Promise.allSettled(
    users.map(async (user) => {
      const [openCount, tomorrowCount] = await Promise.all([
        prisma.task.count({ where: { assigneeId: user.id, completedAt: null } }),
        prisma.task.count({
          where: {
            assigneeId: user.id,
            completedAt: null,
            dueDate: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) },
          },
        }),
      ]);

      if (openCount === 0) return;

      const parts = [`${openCount} ${openCount === 1 ? "taak" : "taken"} openstaand`];
      if (tomorrowCount > 0) parts.push(`${tomorrowCount} ${tomorrowCount === 1 ? "taak" : "taken"} morgen`);

      await sendPushToUser(user.id, {
        title: "Dagelijkse samenvatting",
        body: parts.join(" · "),
        url: "/dashboard",
      });
      notified++;
    })
  );

  return NextResponse.json({ notified });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";

export async function PATCH(req: Request) {
  try {
    const user = await requireFamily();
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.dailyReminderEnabled === "boolean") {
      data.dailyReminderEnabled = body.dailyReminderEnabled;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Geen geldige velden" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { dailyReminderEnabled: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

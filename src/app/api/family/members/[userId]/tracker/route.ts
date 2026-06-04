import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent, apiError } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ userId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const requester = await requireParent();
    const { userId } = await ctx.params;
    const { trackerEnabled } = await req.json();

    if (typeof trackerEnabled !== "boolean") {
      return NextResponse.json({ error: "trackerEnabled moet true of false zijn" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.familyId !== requester.familyId) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { trackerEnabled },
      select: { id: true, name: true, trackerEnabled: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

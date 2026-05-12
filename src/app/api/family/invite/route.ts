import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent, apiError } from "@/lib/auth-helpers";
import { addHours } from "date-fns";
import type { FamilyRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const parent = await requireParent();
    const { role = "CHILD", origin: clientOrigin }: { role?: FamilyRole; origin?: string } =
      await req.json();

    const invite = await prisma.familyInvite.create({
      data: {
        familyId: parent.familyId,
        role,
        expiresAt: addHours(new Date(), 48),
      },
    });

    const url = `${clientOrigin}/join?token=${invite.token}`;
    return NextResponse.json({ token: invite.token, url }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

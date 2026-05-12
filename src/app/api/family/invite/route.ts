import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireParent, apiError } from "@/lib/auth-helpers";
import { addHours } from "date-fns";
import type { FamilyRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const parent = await requireParent();
    const { role = "CHILD" }: { role?: FamilyRole } = await req.json();

    const invite = await prisma.familyInvite.create({
      data: {
        familyId: parent.familyId,
        role,
        expiresAt: addHours(new Date(), 48),
      },
    });

    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
    const proto = hdrs.get("x-forwarded-proto") ?? "https";
    const origin =
      process.env.AUTH_URL?.replace(/\/$/, "") ??
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
      (host ? `${proto}://${host}` : new URL(req.url).origin);
    const url = `${origin}/join?token=${invite.token}`;
    return NextResponse.json({ token: invite.token, url }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

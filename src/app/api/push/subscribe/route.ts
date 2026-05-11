import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { endpoint, keys, userAgent } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dhKey: keys.p256dh, authKey: keys.auth, userAgent },
      create: {
        userId: user.id,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

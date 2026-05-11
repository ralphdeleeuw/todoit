import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { endpoint } = await req.json();
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

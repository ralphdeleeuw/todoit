import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent, apiError } from "@/lib/auth-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const requester = await requireParent();
    const { userId } = await params;
    const { role } = await req.json();

    if (role !== "PARENT" && role !== "CHILD") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.familyId !== requester.familyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

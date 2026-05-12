import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const requester = await requireFamily();
    const { userId } = await params;
    const { role } = await req.json();

    if (role !== "PARENT" && role !== "CHILD") {
      return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.familyId !== requester.familyId) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    }

    const isOwnProfile = requester.id === userId;
    const isParent = requester.role === "PARENT";

    if (!isParent) {
      if (!isOwnProfile) {
        return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
      }
      // Allow self-promotion only if there are no other parents in the family
      const parentCount = await prisma.user.count({
        where: { familyId: requester.familyId, role: "PARENT" },
      });
      if (parentCount > 0) {
        return NextResponse.json(
          { error: "Er is al een ouder in dit gezin" },
          { status: 403 }
        );
      }
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

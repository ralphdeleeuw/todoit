import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await requireFamily();
    const members = await prisma.user.findMany({
      where: { familyId: user.familyId },
      select: { id: true, name: true, image: true, role: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(members);
  } catch (e) {
    return apiError(e);
  }
}

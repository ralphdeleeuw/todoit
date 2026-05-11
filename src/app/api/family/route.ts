import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.familyId) {
      return NextResponse.json({ error: "Already in a family" }, { status: 400 });
    }
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const family = await prisma.family.create({
      data: {
        name: name.trim(),
        members: { connect: { id: user.id } },
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { familyId: family.id, role: "PARENT" },
    });

    return NextResponse.json(family, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

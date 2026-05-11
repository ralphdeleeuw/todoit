import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, requireParent, apiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await requireFamily();
    const labels = await prisma.label.findMany({
      where: { familyId: user.familyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(labels);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireParent();
    const { name, color } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const label = await prisma.label.create({
      data: { name: name.trim(), color: color ?? "#6366f1", familyId: user.familyId },
    });
    return NextResponse.json(label, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

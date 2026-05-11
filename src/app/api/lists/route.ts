import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, requireParent, apiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await requireFamily();
    const lists = await prisma.taskList.findMany({
      where: { familyId: user.familyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(lists);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireParent();
    const { name, color } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const list = await prisma.taskList.create({
      data: { name: name.trim(), color: color ?? null, familyId: user.familyId },
    });
    return NextResponse.json(list, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

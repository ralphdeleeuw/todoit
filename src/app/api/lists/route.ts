import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFamily, apiError } from "@/lib/auth-helpers";

function canAccessList(
  list: { ownerId: string | null; visibility: string; members: { userId: string }[] },
  userId: string
) {
  if (list.visibility === "FAMILY") return true;
  if (list.ownerId === userId) return true;
  if (list.visibility === "SHARED") return list.members.some((m) => m.userId === userId);
  return false;
}

export async function GET() {
  try {
    const user = await requireFamily();
    const lists = await prisma.taskList.findMany({
      where: { familyId: user.familyId },
      include: { members: { select: { userId: true } } },
      orderBy: { name: "asc" },
    });
    const visible = lists.filter((l) => canAccessList(l, user.id));
    return NextResponse.json(visible);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFamily();
    const { name, color, visibility, memberIds, points, effect, defaultAssigneeId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const vis: string = ["PRIVATE", "FAMILY", "SHARED"].includes(visibility)
      ? visibility
      : "FAMILY";

    const list = await prisma.taskList.create({
      data: {
        name: name.trim(),
        color: color ?? null,
        points: typeof points === "number" ? Math.max(0, points) : 10,
        effect: typeof effect === "string" ? effect : "none",
        defaultAssigneeId: user.role === "PARENT" ? (defaultAssigneeId ?? null) : null,
        familyId: user.familyId,
        ownerId: user.id,
        visibility: vis as "PRIVATE" | "FAMILY" | "SHARED",
        members:
          vis === "SHARED" && Array.isArray(memberIds) && memberIds.length > 0
            ? { createMany: { data: memberIds.map((id: string) => ({ userId: id })) } }
            : undefined,
      },
      include: { members: { select: { userId: true } } },
    });
    return NextResponse.json(list, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

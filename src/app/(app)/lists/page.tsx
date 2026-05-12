import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ListsClient from "./ListsClient";

export const metadata = { title: "Lijsten – Todoit" };
export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const session = await verifyFamily();
  const familyId = session.familyId;

  const [allLists, members] = await Promise.all([
    prisma.taskList.findMany({
      where: { familyId },
      include: { members: { select: { userId: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { familyId },
      select: { id: true, name: true, image: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  function canAccess(list: (typeof allLists)[0]) {
    if (list.visibility === "FAMILY") return true;
    if (list.ownerId === session.id) return true;
    if (list.visibility === "SHARED") return list.members.some((m) => m.userId === session.id);
    return false;
  }

  const visibleLists = allLists.filter(canAccess).map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    visibility: l.visibility,
    ownerId: l.ownerId,
    memberIds: l.members.map((m) => m.userId),
  }));

  return (
    <ListsClient
      lists={visibleLists}
      members={members}
      currentUserId={session.id}
      isParent={session.role === "PARENT"}
    />
  );
}

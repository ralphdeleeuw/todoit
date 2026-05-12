import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyFamily();

  const allLists = await prisma.taskList.findMany({
    where: { familyId: session.familyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, visibility: true, ownerId: true, members: { select: { userId: true } } },
  });

  const lists = allLists
    .filter((l) => {
      if (l.visibility === "FAMILY") return true;
      if (l.ownerId === session.id) return true;
      if (l.visibility === "SHARED") return l.members.some((m) => m.userId === session.id);
      return false;
    })
    .map(({ id, name, color }) => ({ id, name, color }));

  const user: SessionUser = {
    id: session.id,
    name: null,
    email: null,
    image: null,
    familyId: session.familyId,
    role: session.role ?? "CHILD",
  };

  return (
    <AppShell user={user} lists={lists}>
      {children}
    </AppShell>
  );
}

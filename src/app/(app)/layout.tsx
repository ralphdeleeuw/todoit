import { verifyFamily } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyFamily();

  const lists = await prisma.taskList.findMany({
    where: { familyId: session.familyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

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

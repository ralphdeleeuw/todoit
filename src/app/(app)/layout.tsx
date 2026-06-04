import { verifyFamily } from "@/lib/dal";
import { getVisibleLists } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyFamily();

  // SQL-filtered + per-request memoized (shared with the dashboard page's fetch).
  const [allLists, dbUser] = await Promise.all([
    getVisibleLists(session.familyId, session.id),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { trackerEnabled: true },
    }),
  ]);
  const lists = allLists.map(({ id, name, color }) => ({ id, name, color }));

  const user: SessionUser = {
    id: session.id,
    name: null,
    email: null,
    image: null,
    familyId: session.familyId,
    role: session.role ?? "CHILD",
    trackerEnabled: dbUser?.trackerEnabled ?? false,
  };

  return (
    <AppShell user={user} lists={lists}>
      {children}
    </AppShell>
  );
}

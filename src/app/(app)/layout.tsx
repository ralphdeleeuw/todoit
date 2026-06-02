import { verifyFamily } from "@/lib/dal";
import { getVisibleLists } from "@/lib/queries";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyFamily();

  // SQL-filtered + per-request memoized (shared with the dashboard page's fetch).
  const allLists = await getVisibleLists(session.familyId, session.id);
  const lists = allLists.map(({ id, name, color }) => ({ id, name, color }));

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

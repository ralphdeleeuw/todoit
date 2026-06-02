import { verifyFamily } from "@/lib/dal";
import { getActiveTasks, getFamilyMembers, getVisibleLists } from "@/lib/queries";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await verifyFamily();
  const role = session.role ?? "CHILD";

  // Fetch everything the dashboard needs in parallel, server-side, so the page
  // paints with data instead of firing 4-5 client requests after hydration.
  const [tasks, members, lists] = await Promise.all([
    getActiveTasks(session.familyId, session.id, role),
    getFamilyMembers(session.familyId),
    getVisibleLists(session.familyId, session.id),
  ]);

  // Serialize to the same JSON shape the API returns (Dates -> ISO strings) so
  // the SWR fallback and later background revalidation are identical.
  const initial = JSON.parse(JSON.stringify({ tasks, members, lists }));

  return (
    <DashboardClient
      initialTasks={initial.tasks}
      initialMembers={initial.members}
      initialLists={initial.lists}
      currentUserId={session.id}
      role={role}
    />
  );
}

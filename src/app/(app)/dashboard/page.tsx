import { verifyFamily } from "@/lib/dal";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await verifyFamily();
  return <DashboardClient />;
}

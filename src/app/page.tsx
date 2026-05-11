import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await verifySession();

  if (!session.familyId) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

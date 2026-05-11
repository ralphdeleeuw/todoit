import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // @ts-expect-error: extended session fields
  if (!session.user.familyId) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionUser } from "@/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const familyId = session.user.familyId as string | null | undefined;
  if (!familyId) {
    redirect("/onboarding");
  }

  const lists = await prisma.taskList.findMany({
    where: { familyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  const user: SessionUser = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    familyId,
    role: session.user.role ?? "CHILD",
  };

  return (
    <AppShell user={user} lists={lists}>
      {children}
    </AppShell>
  );
}

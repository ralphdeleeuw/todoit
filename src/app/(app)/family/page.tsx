import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Crown } from "lucide-react";
import { InviteButton } from "./InviteButton";

export const metadata = { title: "Gezin – Todoit" };

export default async function FamilyPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as string | undefined;
  const familyId = session.user.familyId as string | null | undefined;

  if (!familyId) redirect("/onboarding");
  if (role !== "PARENT") redirect("/dashboard");

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          _count: {
            select: {
              assignedTasks: { where: { completedAt: null } },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!family) redirect("/onboarding");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gezin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{family.name}</p>
      </div>

      {/* Members list */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Gezinsleden ({family.members.length})
        </h2>
        <div className="space-y-2">
          {family.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-white dark:bg-gray-900"
            >
              {/* Avatar */}
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name ?? ""}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm shrink-0">
                  {(member.name ?? member.email ?? "?")[0].toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {member.name ?? "Naamloos"}
                  </span>
                  {member.role === "PARENT" && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                      <Crown className="w-3 h-3" />
                      Ouder
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {member.email}
                </p>
              </div>

              {/* Task count */}
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {member._count.assignedTasks}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {member._count.assignedTasks === 1 ? "taak" : "taken"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Invite section */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Uitnodiging
        </h2>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-white dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Nodig een nieuw gezinslid uit door een uitnodigingslink te delen.
          </p>
          <InviteButton />
        </div>
      </section>
    </div>
  );
}

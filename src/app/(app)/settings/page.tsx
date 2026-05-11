import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PushSubscribeButton } from "@/components/notifications/PushSubscribeButton";
import { SignOutButton } from "./SignOutButton";

export const metadata = { title: "Instellingen – Todoit" };

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const user = session.user;
  // @ts-expect-error: extended session fields
  const role = user.role as string | undefined;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Instellingen</h1>

      {/* Profile section */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Profiel
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? ""}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-semibold shrink-0">
                {(user.name ?? user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {user.name ?? "Naamloos"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                {role === "PARENT" ? "Ouder" : "Kind"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications section */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Meldingen
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Ontvang meldingen op dit apparaat wanneer een taak aan jou is toegewezen of bijna vervalt.
          </p>
          <PushSubscribeButton />
        </div>
      </section>

      {/* Account section */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Account
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[var(--border)] p-4">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}

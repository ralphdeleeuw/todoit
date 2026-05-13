"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, List, Users, Settings, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";
import type { SessionUser } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  user: SessionUser;
  lists: { id: string; name: string; color: string | null }[];
}

const navItems = (isParent: boolean) => [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/lists", label: "Lijsten", icon: List },
  ...(isParent ? [{ href: "/family", label: "Gezin", icon: Users }] : []),
  { href: "/settings", label: "Instellingen", icon: Settings },
];

export function AppShell({ children, user, lists }: AppShellProps) {
  const pathname = usePathname();
  const isParent = user.role === "PARENT";
  const items = navItems(isParent);

  return (
    <div className="flex h-full min-h-screen bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--border)] bg-white dark:bg-gray-900 h-screen sticky top-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shrink-0">
            <CheckSquare className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">Todoit</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {label}
              </Link>
            );
          })}

          {lists.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Lijsten
                </span>
              </div>
              {lists.map((list) => {
                const href = `/list/${list.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={list.id}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: list.color ?? "#6366f1" }}
                    />
                    {list.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-[var(--border)] px-4 py-3 flex items-center gap-3">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? ""}
              className="w-8 h-8 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium shrink-0">
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name ?? "Gebruiker"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page content — pb-28 on mobile leaves room for ArcadeBottomNav */}
        <main className="flex-1 pb-28 md:pb-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Arcade bottom nav (mobile only) */}
      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}

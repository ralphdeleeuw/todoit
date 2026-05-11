"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Users, Settings, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface SidebarProps {
  user: SessionUser;
  lists: { id: string; name: string; color: string | null }[];
}

export function Sidebar({ user, lists }: SidebarProps) {
  const pathname = usePathname();
  const isParent = user.role === "PARENT";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    ...(isParent ? [{ href: "/family", label: "Gezin", icon: Users }] : []),
    { href: "/settings", label: "Instellingen", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--border)] bg-white dark:bg-gray-900 h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shrink-0">
          <CheckSquare className="w-4 h-4" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">Todoit</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
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
              <Icon className="w-4 h-4 shrink-0" />
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

        <div className="pt-4 pb-1 px-3">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Mijn lijsten
          </span>
        </div>
        <Link
          href="/lists"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === "/lists"
              ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          <List className="w-4 h-4 shrink-0" />
          Alle lijsten
        </Link>
      </nav>

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
  );
}

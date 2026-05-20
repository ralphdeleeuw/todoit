"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Taken", icon: Home },
  { href: "/lists",     label: "Lijsten",  icon: List },
  { href: "/score",     label: "Top 4",    icon: Trophy },
  { href: "/family",    label: "Squad",    icon: Users },
];

export function ArcadeBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed z-20 flex items-center justify-around"
      style={{
        left: 12,
        right: 12,
        bottom: 16,
        height: 60,
        borderRadius: 30,
        background: "rgba(15,14,40,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--arc-border-str)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center rounded-full text-xs font-semibold transition-all",
              active ? "gap-1.5 px-3 py-1.5 text-white" : "px-3 py-1.5 text-[var(--arc-muted)]"
            )}
            style={
              active
                ? {
                    background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.5)",
                  }
                : undefined
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {active && label}
          </Link>
        );
      })}
    </nav>
  );
}

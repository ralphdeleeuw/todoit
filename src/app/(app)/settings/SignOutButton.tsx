"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Uitloggen
    </button>
  );
}

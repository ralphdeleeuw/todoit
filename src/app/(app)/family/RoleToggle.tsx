"use client";

import { useState } from "react";
import { Crown, User, Loader2 } from "lucide-react";

interface Props {
  userId: string;
  currentRole: "PARENT" | "CHILD";
}

export function RoleToggle({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const newRole = role === "PARENT" ? "CHILD" : "PARENT";
    setLoading(true);
    try {
      const res = await fetch(`/api/family/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) setRole(newRole);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={role === "PARENT" ? "Maak Kind" : "Maak Ouder"}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : role === "PARENT" ? (
        <Crown className="w-3 h-3 text-amber-500" />
      ) : (
        <User className="w-3 h-3 text-gray-400" />
      )}
      {role === "PARENT" ? "Ouder" : "Kind"}
    </button>
  );
}

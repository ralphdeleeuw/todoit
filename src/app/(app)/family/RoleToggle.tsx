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
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const newRole = role === "PARENT" ? "CHILD" : "PARENT";
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/family/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setRole(newRole);
      } else {
        const data = await res.json();
        setError(data.error ?? "Mislukt");
      }
    } catch {
      setError("Verbindingsfout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        title={role === "PARENT" ? "Klik om Kind te maken" : "Klik om Ouder te maken"}
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
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

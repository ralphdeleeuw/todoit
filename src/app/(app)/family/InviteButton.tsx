"use client";

import { useState } from "react";
import { UserPlus, Copy, Check, Loader2 } from "lucide-react";

export function InviteButton() {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateInvite() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CHILD" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Er ging iets mis");
      }
      const data = await res.json();
      setInviteUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      {!inviteUrl ? (
        <button
          onClick={generateInvite}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          Uitnodigingslink genereren
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-gray-700 dark:text-gray-300 text-xs font-mono focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Gekopieerd!" : "Kopieer"}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Deze link is 48 uur geldig. Deel hem alleen met gezinsleden.
          </p>
          <button
            onClick={() => { setInviteUrl(null); setCopied(false); }}
            className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Nieuwe link genereren
          </button>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

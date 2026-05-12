"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!familyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Er ging iets mis");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteToken.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ongeldig uitnodigingstoken");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welkom bij Todoit</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Maak een gezin aan of sluit je aan bij een bestaand gezin
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => { setTab("create"); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors",
                tab === "create"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Users className="w-4 h-4" />
              Maak gezin aan
            </button>
            <button
              onClick={() => { setTab("join"); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors",
                tab === "join"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <UserPlus className="w-4 h-4" />
              Join via uitnodiging
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {tab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label
                    htmlFor="familyName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Naam van jullie gezin
                  </label>
                  <input
                    id="familyName"
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="bijv. De Familie Jansen"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !familyName.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  {loading ? "Aanmaken..." : "Gezin aanmaken"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label
                    htmlFor="inviteToken"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Uitnodigingscode
                  </label>
                  <input
                    id="inviteToken"
                    type="text"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="Plak hier je uitnodigingscode"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    Vraag een gezinslid om een uitnodigingslink te delen
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !inviteToken.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  {loading ? "Bezig..." : "Aansluiten"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

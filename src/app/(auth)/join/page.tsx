"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckSquare, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Geen uitnodigingstoken gevonden.");
      return;
    }

    async function joinFamily() {
      try {
        const res = await fetch("/api/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Er ging iets mis");
        }
        setStatus("success");
        setMessage("Je bent succesvol toegevoegd aan het gezin!");
        setTimeout(() => router.push("/dashboard"), 1500);
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Er ging iets mis");
      }
    }

    joinFamily();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Todoit</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Aansluiten bij gezin...
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Even geduld alsjeblieft
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Welkom bij het gezin!
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Je wordt doorgestuurd naar het dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Aansluiten mislukt
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
              <button
                onClick={() => router.push("/onboarding")}
                className="mt-6 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                Terug naar start
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}

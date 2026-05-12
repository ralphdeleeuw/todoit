"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckSquare, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { googleSignInWithRedirect } from "@/app/actions/auth";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "unauthenticated">("loading");
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
        if (res.status === 401) {
          setStatus("unauthenticated");
          return;
        }
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

          {status === "unauthenticated" && (
            <>
              <CheckSquare className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Log eerst in
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Je hebt een account nodig om je bij het gezin aan te sluiten.
              </p>
              <form
                action={googleSignInWithRedirect.bind(null, `/join?token=${token}`)}
                className="mt-6"
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Doorgaan met Google
                </button>
              </form>
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

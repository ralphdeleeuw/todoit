"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <p className="text-gray-700 dark:text-gray-300 text-base">Er is iets mis gegaan.</p>
      {process.env.NODE_ENV !== "production" && (
        <p className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/30 rounded p-2 max-w-sm break-all">
          {error.message}
        </p>
      )}
      <button
        onClick={unstable_retry}
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
      >
        Opnieuw proberen
      </button>
    </div>
  );
}

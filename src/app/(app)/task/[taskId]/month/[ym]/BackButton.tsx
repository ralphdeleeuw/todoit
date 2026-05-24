"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="p-2 rounded-xl text-[var(--arc-muted)] hover:text-white transition-colors"
      style={{ background: "var(--arc-panel)" }}
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}

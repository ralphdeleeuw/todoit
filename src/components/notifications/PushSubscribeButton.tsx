"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type SubscriptionState = "idle" | "loading" | "subscribed" | "denied" | "unsupported";

export function PushSubscribeButton() {
  const [state, setState] = useState<SubscriptionState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    // Check existing subscription
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setState("subscribed");
      })
      .catch(() => {});
  }, []);

  async function subscribe() {
    setState("loading");
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("denied");
        return;
      }
      if (permission !== "granted") {
        setState("idle");
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error("Abonneren mislukt");
      setState("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
      setState("idle");
    }
  }

  async function unsubscribe() {
    setState("loading");
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
      setState("subscribed");
    }
  }

  if (state === "unsupported") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <BellOff className="w-4 h-4" />
        Meldingen worden niet ondersteund in deze browser
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
        <BellOff className="w-4 h-4" />
        Meldingen zijn geblokkeerd in de browserinstellingen
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={state === "subscribed" ? unsubscribe : subscribe}
        disabled={state === "loading"}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {state === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === "subscribed" ? (
          <BellOff className="w-4 h-4 text-gray-500" />
        ) : (
          <Bell className="w-4 h-4 text-indigo-500" />
        )}
        {state === "loading"
          ? "Bezig..."
          : state === "subscribed"
          ? "Notificaties uitschakelen"
          : "Notificaties inschakelen"}
      </button>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
      {state === "subscribed" && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Meldingen zijn ingeschakeld
        </p>
      )}
    </div>
  );
}

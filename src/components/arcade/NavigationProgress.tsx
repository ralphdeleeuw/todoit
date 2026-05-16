"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);

  // Detect link clicks to start the bar immediately
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const a = (e.target as Element).closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      // Only trigger for same-origin navigation
      if (href !== pathname) {
        startProgress();
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // Complete when pathname changes
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      completeProgress();
    }
  }, [pathname]);

  function startProgress() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setVisible(true);
    setWidth(15);
    let w = 15;
    intervalRef.current = setInterval(() => {
      // Slow down as it approaches 85%
      const increment = w < 40 ? 8 : w < 65 ? 4 : w < 80 ? 1.5 : 0.3;
      w = Math.min(w + increment, 85);
      setWidth(w);
    }, 200);
  }

  function completeProgress() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]" style={{ background: "transparent" }}>
      <div
        className="h-full"
        style={{
          width: `${width}%`,
          background: "linear-gradient(to right, var(--xp-accent), var(--accent-primary))",
          transition: width === 100 ? "width 0.15s ease-out" : "width 0.2s ease",
          boxShadow: "0 0 8px var(--xp-accent)",
        }}
      />
    </div>
  );
}

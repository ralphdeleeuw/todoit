"use client";

import { LazyMotion } from "framer-motion";

// Async import => framer-motion's feature bundle is fetched after first paint
// and kept out of the initial chunk. Until it loads, `m` elements render their
// static styles (transforms included), so nothing breaks visually.
const loadFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}

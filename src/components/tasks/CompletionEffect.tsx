"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface CompletionEffectProps {
  effect: string;
  show: boolean;
  onDismiss?: () => void;
}

const EFFECT_CONFIG: Record<string, { particles: string[]; colors: string[] }> = {
  confetti: {
    particles: ["■", "●", "▲", "◆", "▬", "◉"],
    colors: ["#f43f5e", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7"],
  },
  stars: {
    particles: ["★", "✦", "✧", "⋆", "✩", "✸"],
    colors: ["#facc15", "#fde047", "#fbbf24", "#fef08a", "#fcd34d"],
  },
  hearts: {
    particles: ["♥", "❤", "♡", "💕"],
    colors: ["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#e11d48"],
  },
  fireworks: {
    particles: ["★", "✦", "•", "◆", "✸", "✺"],
    colors: ["#f43f5e", "#f97316", "#facc15", "#06d6c4", "#a855f7", "#3b82f6"],
  },
  bubbles: {
    particles: ["○", "◌", "⊙", "◎", "○"],
    colors: ["#7dd3fc", "#bae6fd", "#a5f3fc", "#93c5fd", "#e0f2fe"],
  },
  raindrops: {
    particles: ["●", "•", "◦", "○", "◉"],
    colors: ["#f43f5e", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7"],
  },
};

export const EFFECT_DURATION = 2200;

export function CompletionEffect({ effect, show, onDismiss }: CompletionEffectProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!show || !onDismiss) return;
    const t = setTimeout(onDismiss, EFFECT_DURATION);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  // Re-randomize particles each time the effect is triggered
  const particles = useMemo(() => {
    if (!EFFECT_CONFIG[effect]) return [];
    const cfg = EFFECT_CONFIG[effect];
    return Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * 2 * Math.PI + (Math.random() - 0.5) * 0.6;
      const distance = 80 + Math.random() * 130;
      return {
        id: i,
        char: cfg.particles[i % cfg.particles.length],
        color: cfg.colors[i % cfg.colors.length],
        x: Math.cos(angle) * distance,
        y: -Math.abs(Math.sin(angle)) * distance - 40 - Math.random() * 60,
        rotate: (Math.random() - 0.5) * 540,
        scale: 0.8 + Math.random() * 0.9,
        delay: Math.random() * 0.12,
        size: 14 + Math.random() * 12,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, show]);

  if (!mounted || !EFFECT_CONFIG[effect]) return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9999 }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: p.scale, rotate: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: p.x,
                  y: p.y,
                  scale: [p.scale, p.scale, p.scale * 0.3],
                  rotate: p.rotate,
                }}
                transition={{
                  duration: 2,
                  delay: p.delay,
                  opacity: { times: [0, 0.65, 1], ease: "easeIn" },
                  scale: { times: [0, 0.65, 1], ease: "easeOut" },
                  x: { ease: "easeOut" },
                  y: { ease: "easeOut" },
                  rotate: { ease: "easeOut" },
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none leading-none"
                style={{ color: p.color, fontSize: p.size }}
              >
                {p.char}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useEffect } from "react";

interface CompletionEffectProps {
  effect: string;
  show: boolean;
  onDismiss?: () => void;
}

const EFFECT_CONFIG: Record<string, { particles: string[]; colors: string[] }> = {
  confetti: {
    particles: ["■", "●", "▲", "◆", "▬"],
    colors: ["#f43f5e", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7"],
  },
  stars: {
    particles: ["★", "✦", "✧", "⋆", "✩"],
    colors: ["#facc15", "#fde047", "#fbbf24", "#fef08a", "#fcd34d"],
  },
  hearts: {
    particles: ["♥", "❤", "♡"],
    colors: ["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#e11d48"],
  },
  fireworks: {
    particles: ["★", "✦", "•", "◆", "✸"],
    colors: ["#f43f5e", "#f97316", "#facc15", "#06d6c4", "#a855f7", "#3b82f6"],
  },
  bubbles: {
    particles: ["○", "◌", "⊙", "◎"],
    colors: ["#7dd3fc", "#bae6fd", "#a5f3fc", "#93c5fd", "#e0f2fe"],
  },
  raindrops: {
    particles: ["●", "•", "◦", "○"],
    colors: ["#f43f5e", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7"],
  },
};

export function CompletionEffect({ effect, show, onDismiss }: CompletionEffectProps) {
  useEffect(() => {
    if (!show || !onDismiss) return;
    const t = setTimeout(onDismiss, 1600);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  const particles = useMemo(() => {
    if (effect === "none" || !EFFECT_CONFIG[effect]) return [];
    const cfg = EFFECT_CONFIG[effect];
    return Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
      const distance = 60 + Math.random() * 100;
      return {
        id: i,
        char: cfg.particles[i % cfg.particles.length],
        color: cfg.colors[i % cfg.colors.length],
        x: Math.cos(angle) * distance,
        y: -Math.abs(Math.sin(angle)) * distance - 30 - Math.random() * 40,
        rotate: (Math.random() - 0.5) * 540,
        scale: 0.7 + Math.random() * 0.8,
        delay: Math.random() * 0.15,
        size: 11 + Math.random() * 9,
      };
    });
  }, [effect, show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (effect === "none" || !EFFECT_CONFIG[effect]) return null;

  return (
    <AnimatePresence>
      {show && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 60, overflow: "visible" }}
          aria-hidden
        >
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: p.scale, rotate: 0 }}
              animate={{
                opacity: 0,
                x: p.x,
                y: p.y,
                scale: p.scale * 0.3,
                rotate: p.rotate,
              }}
              transition={{
                duration: 1.3,
                delay: p.delay,
                ease: [0.15, 0.85, 0.35, 1],
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none leading-none"
              style={{ color: p.color, fontSize: p.size }}
            >
              {p.char}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

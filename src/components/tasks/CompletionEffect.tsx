"use client";

import { m, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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

// Particles are generated once per trigger and stored in a ref so they
// don't re-randomize on re-renders, which would restart the CSS animation.
function buildParticles(effect: string) {
  const cfg = EFFECT_CONFIG[effect];
  if (!cfg) return [];
  return Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
    const distance = 90 + Math.random() * 140;
    return {
      id: i,
      char: cfg.particles[i % cfg.particles.length],
      color: cfg.colors[i % cfg.colors.length],
      x: Math.cos(angle) * distance,
      y: -Math.abs(Math.sin(angle)) * distance - 50 - Math.random() * 70,
      rotate: (Math.random() - 0.5) * 600,
      scale: 1.0 + Math.random() * 1.0,
      delay: (i / 24) * 0.1,
      size: 18 + Math.random() * 14,
    };
  });
}

export function CompletionEffect({ effect, show, onDismiss }: CompletionEffectProps) {
  const [mounted, setMounted] = useState(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // Particles are stable for the lifetime of this show=true trigger
  const particlesRef = useRef(buildParticles(effect));
  const prevShowRef = useRef(false);
  if (show && !prevShowRef.current) {
    particlesRef.current = buildParticles(effect);
  }
  prevShowRef.current = show;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer fires once when show flips to true; uses ref so re-renders don't reset it
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => dismissRef.current?.(), EFFECT_DURATION);
    return () => clearTimeout(t);
  }, [show]);

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
            {particlesRef.current.map((p) => (
              <m.span
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: p.scale, rotate: 0 }}
                animate={{ opacity: 0, x: p.x, y: p.y, scale: 0, rotate: p.rotate }}
                transition={{
                  duration: 2,
                  delay: p.delay,
                  opacity: { duration: 2, delay: p.delay + 1.2, ease: "easeIn" },
                  ease: "easeOut",
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none leading-none"
                style={{ color: p.color, fontSize: p.size }}
              >
                {p.char}
              </m.span>
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

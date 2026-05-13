"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ComboMeterProps {
  combo: number; // 0 = hidden, 2+ = show
}

function comboLabel(n: number): { text: string; color: string } {
  if (n >= 5) return { text: `ON FIRE! ×${n}`, color: "#ef4444" };
  if (n >= 3) return { text: `COMBO! ×${n}`, color: "#f97316" };
  return { text: `NICE! ×${n}`, color: "#facc15" };
}

export function ComboMeter({ combo }: ComboMeterProps) {
  const show = combo >= 2;
  const { text, color } = comboLabel(combo);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="combo"
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-4 left-1/2 z-[70] -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full pointer-events-none"
          style={{
            background: `${color}22`,
            border: `1.5px solid ${color}`,
            boxShadow: `0 0 20px ${color}66`,
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm font-black tabular-nums"
            style={{ color }}
          >
            {text}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

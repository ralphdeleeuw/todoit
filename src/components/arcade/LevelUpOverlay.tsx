"use client";

import { useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";

interface LevelUpOverlayProps {
  show: boolean;
  level: number;
  memberName: string;
  memberImage?: string | null;
  memberColor?: string;
  onDismiss: () => void;
}

const RAYS = Array.from({ length: 14 }, (_, i) => i);

export function LevelUpOverlay({
  show, level, memberName, memberImage, memberColor = "#7c3aed", onDismiss,
}: LevelUpOverlayProps) {
  // Auto-dismiss after 4s
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${memberColor}88 0%, #0c0a26 50%, #08081a 80%)`,
          }}
          onClick={onDismiss}
        >
          {/* Rotating rays */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <m.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="relative w-full h-full"
            >
              {RAYS.map((i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  transition={{ delay: i * 0.05 }}
                  className="absolute left-1/2 top-0 w-[5px] origin-bottom"
                  style={{
                    height: "50%",
                    transform: `rotate(${(360 / 14) * i}deg) translateX(-50%)`,
                    background: `linear-gradient(to top, ${memberColor}, transparent)`,
                    borderRadius: "4px 4px 0 0",
                  }}
                />
              ))}
            </m.div>
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center gap-4 px-8 text-center">
            <m.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs font-black tracking-[0.3em] uppercase"
              style={{ color: memberColor, letterSpacing: "0.3em" }}
            >
              {memberName.toUpperCase()}
            </m.p>

            <m.h1
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
              className="text-5xl font-black"
              style={{
                background: `linear-gradient(135deg, #fff 0%, ${memberColor} 50%, #facc15 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 20px ${memberColor}88)`,
              }}
            >
              LEVEL UP!
            </m.h1>

            <m.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: "spring", bounce: 0.5 }}
              className="text-4xl font-black tabular-nums"
              style={{ color: "#facc15", textShadow: "0 0 20px #facc1566" }}
            >
              Level {level}
            </m.p>

            {/* Avatar */}
            <m.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.8, type: "spring", bounce: 0.5 }}
              className="relative"
            >
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-60"
                style={{ background: memberColor, transform: "scale(1.3)" }}
              />
              <div
                className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-4"
                style={{ borderColor: memberColor, boxShadow: `0 0 30px ${memberColor}88` }}
              >
                {memberImage ? (
                  <img src={memberImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-white">
                    {memberName[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </m.div>

            {/* Unlock card */}
            <m.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="px-5 py-3 rounded-2xl"
              style={{ background: `${memberColor}22`, border: `1px solid ${memberColor}44` }}
            >
              <p className="text-[10px] text-[var(--arc-muted)] mb-0.5">🎁 Unlocked</p>
              <p className="text-sm font-bold text-white">Nieuw badge: Klusbaas {level}</p>
            </m.div>

            {/* CTA */}
            <m.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              onClick={onDismiss}
              className="px-8 py-3 rounded-full font-bold text-white text-sm"
              style={{
                background: `linear-gradient(135deg, ${memberColor}, #facc15)`,
                boxShadow: `0 4px 20px ${memberColor}66`,
              }}
            >
              Doorgaan ✨
            </m.button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useRef, useState, useCallback } from "react";
import { useDrag } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, Calendar, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listColor } from "@/lib/arcade";
import type { TaskWithRelations } from "@/types";

interface MissionRowProps {
  task: TaskWithRelations;
  onComplete: () => void;
  onMoveToTomorrow: () => void;
  onOpenDetail: () => void;
  onDelete: () => void;
  onPickDate?: () => void;
}

const SWIPE_THRESHOLD = 64;
const RESISTANCE_LIMIT = 120;
const LONG_PRESS_MS = 380;

export function MissionRow({
  task,
  onComplete,
  onMoveToTomorrow,
  onOpenDetail,
  onDelete,
  onPickDate,
}: MissionRowProps) {
  const [x, setX] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [floater, setFloater] = useState<string | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureMode = useRef<"idle" | "swipe" | "longpress">("idle");
  const startPos = useRef({ x: 0, y: 0 });

  const borderColor = listColor(task.list?.color);
  const dueStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
    : null;
  const assigneeInitial = (task.assignee?.name ?? "?")[0].toUpperCase();

  // Resistance curve: linear to RESISTANCE_LIMIT, then 0.3x
  function applyResistance(raw: number): number {
    const abs = Math.abs(raw);
    const sign = raw < 0 ? -1 : 1;
    if (abs <= RESISTANCE_LIMIT) return raw;
    return sign * (RESISTANCE_LIMIT + (abs - RESISTANCE_LIMIT) * 0.3);
  }

  const bind = useDrag(
    ({ first, last, movement: [mx, my], velocity: [vx], xy, event }) => {
      if (first) {
        startPos.current = { x: xy[0], y: xy[1] };
        gestureMode.current = "idle";

        longPressTimer.current = setTimeout(() => {
          if (gestureMode.current === "idle") {
            gestureMode.current = "longpress";
            navigator.vibrate?.(30);
            onOpenDetail();
          }
        }, LONG_PRESS_MS);
      }

      const absX = Math.abs(mx);
      const absY = Math.abs(my);

      // Lock to swipe once we move 6px horizontally
      if (gestureMode.current === "idle" && absX > 6) {
        gestureMode.current = "swipe";
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }

      if (gestureMode.current === "swipe") {
        setX(applyResistance(mx));
      }

      if (last) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (gestureMode.current === "swipe") {
          if (mx >= SWIPE_THRESHOLD || (vx > 0.5 && mx > 20)) {
            // swipe right → move to tomorrow
            onMoveToTomorrow();
          } else if (mx <= -SWIPE_THRESHOLD || (vx < -0.5 && mx < -20)) {
            // swipe left → open quick options (we leave drawer open)
            setX(-140);
            return;
          }
          setX(0);
        } else if (gestureMode.current === "idle") {
          // tap — only if we didn't move much
          if (Math.abs(mx) < 6 && Math.abs(my) < 6) {
            onOpenDetail();
          }
        }

        gestureMode.current = "idle";
      }
    },
    { filterTaps: false, axis: undefined }
  );

  function handleCheckboxComplete(e: React.MouseEvent) {
    e.stopPropagation();
    if (completing) return;
    setCompleting(true);
    navigator.vibrate?.(30);
    setFloater(`+${task.list?.points ?? 0} XP`);
    setTimeout(() => {
      onComplete();
    }, 600);
  }

  function closeQuickOptions() {
    setX(0);
  }

  const isQuickOpen = x <= -SWIPE_THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-2">
      {/* Swipe-right reveal layer (move to tomorrow) */}
      <div
        className="absolute inset-0 flex items-center px-5 rounded-2xl"
        style={{
          background: "linear-gradient(to right, #4f46e5, #db2777)",
          opacity: Math.min(1, Math.max(0, x / SWIPE_THRESHOLD)),
        }}
      >
        <span className="text-white font-bold text-sm">🚀 → MORGEN</span>
      </div>

      {/* Swipe-left quick options */}
      <AnimatePresence>
        {isQuickOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-y-0 right-0 flex items-center gap-2 px-3"
            style={{ background: "var(--arc-panel-2)" }}
          >
            <QuickChip
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Datum"
              onClick={() => { closeQuickOptions(); onPickDate?.(); }}
              color="#6366f1"
            />
            <QuickChip
              icon={<Pencil className="w-3.5 h-3.5" />}
              label="Bewerk"
              onClick={() => { closeQuickOptions(); onOpenDetail(); }}
              color="#06d6c4"
            />
            <QuickChip
              icon={<Trash2 className="w-3.5 h-3.5" />}
              label="Wis"
              onClick={() => { closeQuickOptions(); onDelete(); }}
              color="#f43f5e"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main row */}
      <motion.div
        {...(bind() as object)}
        style={{ x, touchAction: "pan-y" }}
        animate={{ x }}
        transition={x === 0 ? { type: "spring", stiffness: 300, damping: 30 } : { duration: 0 }}
        className={cn(
          "relative flex items-center gap-3 px-4 cursor-grab active:cursor-grabbing select-none",
          completing && "opacity-50 pointer-events-none"
        )}
        onClick={isQuickOpen ? closeQuickOptions : undefined}
      >
        {/* Left border accent */}
        <div
          className="absolute left-0 inset-y-0 w-[3px] rounded-l-2xl"
          style={{ backgroundColor: borderColor }}
        />

        <div
          className="flex items-center gap-3 w-full py-4 pl-3"
          style={{
            background: "linear-gradient(135deg, #1d1c3d 0%, #15142e 100%)",
            borderRadius: 16,
            minHeight: 74,
          }}
        >
          {/* Checkbox */}
          <div
            className="shrink-0"
            onPointerDown={handleCheckboxComplete}
          >
            <Checkbox.Root
              checked={completing}
              className="w-[30px] h-[30px] rounded-[9px] border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: completing ? borderColor : "rgba(255,255,255,0.2)",
                backgroundColor: completing ? borderColor : "transparent",
                boxShadow: completing ? `0 0 12px ${borderColor}88` : undefined,
              }}
              onClick={(e) => e.preventDefault()}
            >
              <Checkbox.Indicator>
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </Checkbox.Indicator>
            </Checkbox.Root>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-white text-sm leading-snug truncate">
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {dueStr && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)", color: "var(--arc-muted)" }}
                >
                  📅 {dueStr}
                </span>
              )}
              {task.list && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `${listColor(task.list.color)}22`,
                    color: listColor(task.list.color),
                  }}
                >
                  {task.list.name}
                </span>
              )}
            </div>
          </div>

          {/* Right: gem chip + avatar */}
          <div className="flex items-center gap-2 shrink-0 pr-1">
            <span
              className="text-[11px] font-bold px-2 py-1 rounded-full tabular-nums"
              style={{ background: "#facc1522", color: "#facc15" }}
            >
              💎 {task.list?.points ?? 0}
            </span>
            {task.openForClaim ? (
              <div
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-sm"
                style={{ background: "#f59e0b22", border: "1px solid #f59e0b66" }}
                title="Wie pakt deze?"
              >
                🙋
              </div>
            ) : (
              <div
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                style={{ background: "#6366f1" }}
              >
                {task.assignee?.image ? (
                  <img
                    src={task.assignee.image}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  assigneeInitial
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* XP floater */}
      <AnimatePresence onExitComplete={() => setFloater(null)}>
        {floater && completing && (
          <motion.div
            key="floater"
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -48, scale: 1.2 }}
            transition={{ duration: 1.3, ease: [0.2, 0.7, 0.4, 1] }}
            className="absolute right-16 top-3 text-xs font-black pointer-events-none"
            style={{ color: "#facc15", textShadow: "0 0 8px #facc1588" }}
          >
            {floater}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickChip({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-opacity active:opacity-70"
      style={{ background: `${color}22`, color }}
    >
      {icon}
      {label}
    </button>
  );
}

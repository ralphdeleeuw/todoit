"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import useSWR from "swr";
import { Bell, Settings, Loader2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import Link from "next/link";

import { MissionRow } from "@/components/arcade/MissionRow";
import { SectionHead } from "@/components/arcade/SectionHead";
import { LevelCard } from "@/components/arcade/LevelCard";
import { AvatarFilterStrip } from "@/components/arcade/AvatarFilterStrip";
import { ArcadeFAB } from "@/components/arcade/ArcadeFAB";
import { ArcadeNewTaskSheet } from "@/components/arcade/ArcadeNewTaskSheet";
import { ArcadeTaskDetail } from "@/components/arcade/ArcadeTaskDetail";
import { LevelUpOverlay } from "@/components/arcade/LevelUpOverlay";
import { ComboMeter } from "@/components/arcade/ComboMeter";

import { bucketTask, BUCKET_ORDER, BUCKET_META, calcLevel } from "@/lib/arcade";
import type { TaskWithRelations, ArcadeMember, CompleteResult } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MEMBER_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

interface UndoToast {
  task: TaskWithRelations;
  timeoutId: ReturnType<typeof setTimeout>;
  completePromise: Promise<CompleteResult | null>;
  completed: boolean;
}

type NotifCategory = "overdue" | "today" | "tomorrow";
interface NotificationItem {
  id: string;
  category: NotifCategory;
  task: TaskWithRelations;
}

function NotificationPopoverContent({
  notifications,
  onSelectTask,
}: {
  notifications: NotificationItem[];
  onSelectTask: (task: TaskWithRelations) => void;
}) {
  const categories: NotifCategory[] = ["overdue", "today", "tomorrow"];
  const grouped = categories
    .map((cat) => ({ cat, items: notifications.filter((n) => n.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="py-3">
      <div
        className="flex items-center justify-between px-4 pb-3"
        style={{ borderBottom: "1px solid var(--arc-border)" }}
      >
        <span className="text-xs font-bold tracking-widest uppercase text-[var(--arc-muted)]">
          Meldingen
        </span>
        {notifications.length > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: "var(--arc-panel)", color: "var(--arc-muted)" }}
          >
            {notifications.length}
          </span>
        )}
      </div>

      {grouped.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
          <span className="text-2xl">✅</span>
          <p className="text-white text-sm font-semibold">Geen meldingen</p>
          <p className="text-[11px] text-[var(--arc-muted)]">Alles staat op schema!</p>
        </div>
      )}

      {grouped.map(({ cat, items }) => {
        const meta = BUCKET_META[cat];
        return (
          <div key={cat} className="mt-3">
            <div className="flex items-center gap-1.5 px-4 mb-1.5">
              <span className="text-xs">{meta.emoji}</span>
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                style={{ background: `${meta.color}22`, color: meta.color }}
              >
                {items.length}
              </span>
            </div>
            {items.map(({ task }) => {
              const color = task.list?.color ?? "#6366f1";
              const dueStr = task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })
                : null;
              return (
                <button
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <div
                    className="w-0.5 h-8 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate leading-snug">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-[var(--arc-muted)]">
                      {dueStr}
                      {task.list ? ` · ${task.list.name}` : ""}
                      {task.assignee?.name ? ` · ${task.assignee.name}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardClient() {
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Undo toast
  const [undoToast, setUndoToast] = useState<{ task: TaskWithRelations; remaining: number } | null>(null);
  const undoRef = useRef<UndoToast | null>(null);
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // LevelUp state
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null);

  // Combo tracking
  const comboTimestamps = useRef<number[]>([]);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [combo, setCombo] = useState(0);

  const {
    data: tasks,
    isLoading: tasksLoading,
    mutate: mutateTasks,
  } = useSWR<TaskWithRelations[]>("/api/tasks?completed=false", fetcher);

  const {
    data: completedTasks,
    isLoading: completedLoading,
    mutate: mutateCompleted,
  } = useSWR<TaskWithRelations[]>(
    showCompleted ? "/api/tasks?completed=true&take=30" : null,
    fetcher
  );

  const { data: rawMembers = [], mutate: mutateMembers } = useSWR<ArcadeMember[]>(
    "/api/family/members",
    fetcher,
    { onError: () => {} }
  );

  const { data: lists = [] } = useSWR("/api/lists", fetcher);
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);

  const currentUserId: string = sessionData?.user?.id ?? "";
  const isParent: boolean = sessionData?.user?.role === "PARENT";

  const members: ArcadeMember[] = rawMembers.map((m) => ({
    ...m,
    level: calcLevel(m.xp ?? 0),
  }));

  const currentMember = members.find((m) => m.id === currentUserId) ?? null;
  const weekRank = currentMember
    ? [...members].sort((a, b) => (b.weekXp ?? 0) - (a.weekXp ?? 0)).findIndex((m) => m.id === currentUserId) + 1
    : undefined;

  const [notifOpen, setNotifOpen] = useState(false);

  const activeTasks = (tasks ?? []).filter((t) => !t.completedAt);
  const filteredTasks = filterMemberId
    ? activeTasks.filter((t) => t.assignee?.id === filterMemberId)
    : activeTasks;

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!tasks) return [];
    const cats: NotifCategory[] = ["overdue", "today", "tomorrow"];
    return cats.flatMap((cat) =>
      activeTasks
        .filter((t) => bucketTask(t.dueDate) === cat)
        .map((t) => ({ id: t.id, category: cat, task: t }))
    );
  }, [tasks, activeTasks]);

  const hasOverdue = notifications.some((n) => n.category === "overdue");

  const bucketed = BUCKET_ORDER.reduce<Record<string, TaskWithRelations[]>>(
    (acc, bucket) => { acc[bucket] = filteredTasks.filter((t) => bucketTask(t.dueDate) === bucket); return acc; },
    {} as Record<string, TaskWithRelations[]>
  );

  const filterMember = members.find((m) => m.id === filterMemberId);

  function trackCombo(assigneeId: string) {
    const now = Date.now();
    const window = 30_000;
    comboTimestamps.current = [...comboTimestamps.current, now].filter((t) => now - t < window);
    const count = comboTimestamps.current.length;
    setCombo(count);

    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => {
      setCombo(0);
      comboTimestamps.current = [];
    }, 6000);
  }

  function clearUndoToast() {
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    undoIntervalRef.current = null;
    undoRef.current = null;
    setUndoToast(null);
  }

  function startUndoToast(task: TaskWithRelations, completePromise: Promise<CompleteResult | null>) {
    // Clear any existing toast
    if (undoRef.current) {
      clearTimeout(undoRef.current.timeoutId);
      clearUndoToast();
    }

    const DURATION = 5000;
    const timeoutId = setTimeout(() => {
      clearUndoToast();
    }, DURATION);

    undoRef.current = { task, timeoutId, completePromise, completed: false };
    setUndoToast({ task, remaining: DURATION / 1000 });

    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    undoIntervalRef.current = setInterval(() => {
      setUndoToast((prev) => {
        if (!prev) return null;
        const next = prev.remaining - 1;
        if (next <= 0) return null;
        return { ...prev, remaining: next };
      });
    }, 1000);
  }

  const handleUndo = useCallback(async () => {
    const ref = undoRef.current;
    if (!ref) return;
    clearTimeout(ref.timeoutId);
    clearUndoToast();

    const task = ref.task;

    // Re-add task optimistically
    mutateTasks((prev) => (prev ? [task, ...prev] : [task]), false);
    mutateCompleted((prev) => prev?.filter((t) => t.id !== task.id) ?? [], false);

    // Wait for complete to finish (if still running) then uncomplete
    await ref.completePromise;
    try {
      const res = await fetch(`/api/tasks/${task.id}/uncomplete`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        mutateMembers(
          (prev) =>
            prev?.map((m) =>
              m.id === currentUserId
                ? { ...m, xp: data.xp, weekXp: data.weekXp, level: calcLevel(data.xp) }
                : m
            ) ?? [],
          false
        );
      }
    } catch {
      // noop
    }
    mutateTasks();
    mutateCompleted();
  }, [mutateTasks, mutateCompleted, mutateMembers, currentUserId]);

  const handleUncomplete = useCallback(
    async (task: TaskWithRelations) => {
      mutateCompleted((prev) => prev?.filter((t) => t.id !== task.id) ?? [], false);
      mutateTasks((prev) => (prev ? [{ ...task, completedAt: null }, ...prev] : [{ ...task, completedAt: null }]), false);

      try {
        const res = await fetch(`/api/tasks/${task.id}/uncomplete`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          mutateMembers(
            (prev) =>
              prev?.map((m) =>
                m.id === currentUserId
                  ? { ...m, xp: data.xp, weekXp: data.weekXp, level: calcLevel(data.xp) }
                  : m
              ) ?? [],
            false
          );
        }
      } catch {
        // noop
      }
      mutateTasks();
      mutateCompleted();
    },
    [mutateCompleted, mutateTasks, mutateMembers, currentUserId]
  );

  const handleCreated = useCallback(
    (task: TaskWithRelations) => {
      mutateTasks((prev) => (prev ? [task, ...prev] : [task]), false);
    },
    [mutateTasks]
  );

  const handleUpdated = useCallback(
    (updated: TaskWithRelations) => {
      mutateTasks((prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? [], false);
    },
    [mutateTasks]
  );

  const handleDeleted = useCallback(
    (taskId: string) => {
      mutateTasks((prev) => prev?.filter((t) => t.id !== taskId) ?? [], false);
    },
    [mutateTasks]
  );

  const handleComplete = useCallback(
    async (task: TaskWithRelations) => {
      mutateTasks((prev) => prev?.filter((t) => t.id !== task.id) ?? [], false);
      trackCombo(task.assigneeId ?? "");

      let resolvePromise!: (v: CompleteResult | null) => void;
      const completePromise = new Promise<CompleteResult | null>((res) => { resolvePromise = res; });

      startUndoToast(task, completePromise);

      try {
        const res = await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
        if (res.ok) {
          const data: CompleteResult = await res.json();
          resolvePromise(data);
          mutateMembers(
            (prev) =>
              prev?.map((m) =>
                m.id === currentUserId
                  ? { ...m, xp: data.xp, weekXp: data.weekXp, streak: data.streak, level: calcLevel(data.xp) }
                  : m
              ) ?? [],
            false
          );
          if (data.levelUp) {
            setLevelUpData({ level: data.newLevel });
          }
          if (data.nextTask) mutateTasks();
          mutateCompleted();
        } else {
          resolvePromise(null);
          mutateTasks();
        }
      } catch {
        resolvePromise(null);
        mutateTasks();
      }
    },
    [mutateTasks, mutateMembers, mutateCompleted, currentUserId]
  );

  const handleMoveToTomorrow = useCallback(
    async (task: TaskWithRelations) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      mutateTasks(
        (prev) => prev?.map((t) => (t.id === task.id ? { ...t, dueDate: tomorrow } : t)) ?? [],
        false
      );
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: tomorrow.toISOString() }),
      });
    },
    [mutateTasks]
  );

  const handleDelete = useCallback(
    async (task: TaskWithRelations) => {
      mutateTasks((prev) => prev?.filter((t) => t.id !== task.id) ?? [], false);
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    },
    [mutateTasks]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      if (undoRef.current) clearTimeout(undoRef.current.timeoutId);
    };
  }, []);

  const openTaskCount = activeTasks.length;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {/* Combo meter */}
      <ComboMeter combo={combo} />

      {/* Level-up overlay */}
      <LevelUpOverlay
        show={!!levelUpData}
        level={levelUpData?.level ?? 1}
        memberName={currentMember?.name ?? ""}
        memberImage={currentMember?.image}
        memberColor={MEMBER_COLORS[members.findIndex((m) => m.id === currentUserId) % MEMBER_COLORS.length]}
        onDismiss={() => setLevelUpData(null)}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--arc-muted)] uppercase">TODOIT</p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Taken</h1>
            {openTaskCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                style={{ background: "var(--arc-panel-2)", color: "var(--arc-muted)" }}>
                {openTaskCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover.Root open={notifOpen} onOpenChange={setNotifOpen}>
            <Popover.Trigger asChild>
              <button
                className="relative p-1 rounded-xl transition-colors hover:bg-white/10 active:scale-95"
                aria-label="Meldingen"
              >
                <Bell className="w-5 h-5 text-[var(--arc-muted)]" />
                {hasOverdue && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="end"
                sideOffset={8}
                className="z-50 w-[min(340px,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto outline-none"
                style={{
                  background: "var(--arc-panel-2)",
                  border: "1px solid var(--arc-border-str)",
                  borderRadius: "16px",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                }}
              >
                <NotificationPopoverContent
                  notifications={notifications}
                  onSelectTask={(task) => {
                    setNotifOpen(false);
                    setSelectedTask(task);
                  }}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <Link href="/settings">
            <Settings className="w-5 h-5 text-[var(--arc-muted)]" />
          </Link>
        </div>
      </header>

      {currentMember && <LevelCard member={currentMember} weekRank={weekRank} />}

      <AvatarFilterStrip members={members} selectedId={filterMemberId} onSelect={setFilterMemberId} />

      {/* Task list */}
      {tasksLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--xp-accent)" }} />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="mx-4 mt-6 p-6 rounded-2xl flex flex-col items-center gap-2 text-center"
          style={{ border: "1.5px dashed var(--arc-border-str)", background: "var(--arc-panel)" }}>
          <span className="text-2xl">🎉</span>
          <p className="text-white font-semibold">
            {filterMember ? `${filterMember.name} is helemaal klaar!` : "Alles gedaan!"}
          </p>
          <p className="text-[var(--arc-muted)] text-xs">Geen openstaande taken</p>
        </div>
      ) : (
        <div className="px-4">
          {BUCKET_ORDER.map((bucket) => {
            const group = bucketed[bucket];
            if (!group || group.length === 0) return null;
            return (
              <div key={bucket}>
                <SectionHead bucket={bucket} count={group.length} />
                {group.map((task) => (
                  <MissionRow
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task)}
                    onMoveToTomorrow={() => handleMoveToTomorrow(task)}
                    onOpenDetail={() => setSelectedTask(task)}
                    onDelete={() => handleDelete(task)}
                    onClaimed={handleUpdated}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed tasks section */}
      <div className="px-4 mt-6">
        <button
          onClick={() => setShowCompleted((v) => !v)}
          className="flex items-center gap-2 w-full py-2 text-[var(--arc-muted)] text-xs font-bold tracking-widest uppercase"
        >
          {showCompleted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Voltooide taken
        </button>

        {showCompleted && (
          <div className="mt-2 space-y-2">
            {completedLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--xp-accent)" }} />
              </div>
            ) : (completedTasks ?? []).length === 0 ? (
              <p className="text-[var(--arc-muted)] text-xs text-center py-4">Nog geen voltooide taken</p>
            ) : (
              (completedTasks ?? []).map((task) => {
                const color = task.list?.color ?? "#6366f1";
                const completedStr = task.completedAt
                  ? new Date(task.completedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
                  : "";
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 opacity-50"
                      style={{ background: `${color}22` }}
                    >
                      {task.title.match(/^\p{Emoji}/u)?.[0] ?? "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate line-through opacity-50">
                        {task.title.replace(/^\p{Emoji}\s*/u, "")}
                      </p>
                      <p className="text-[10px] text-[var(--arc-muted-deep)]">{completedStr}{task.list ? ` · ${task.list.name}` : ""}</p>
                    </div>
                    <button
                      onClick={() => handleUncomplete(task)}
                      className="shrink-0 p-2 rounded-xl transition-colors hover:bg-white/10"
                      style={{ color: "var(--xp-accent)" }}
                      title="Ongedaan maken"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Arcade task detail sheet */}
      {selectedTask && (
        <ArcadeTaskDetail
          task={selectedTask}
          members={members}
          isParent={isParent}
          currentUserId={currentUserId}
          open={!!selectedTask}
          onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
          onUpdated={(updated) => { handleUpdated(updated); setSelectedTask(null); }}
          onDeleted={(id) => { handleDeleted(id); setSelectedTask(null); }}
          onCompleted={(id) => {
            const t = activeTasks.find((t) => t.id === id);
            if (t) handleComplete(t);
            setSelectedTask(null);
          }}
        />
      )}

      {/* Arcade new task sheet */}
      <ArcadeNewTaskSheet
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        members={members}
        lists={lists}
        currentUserId={currentUserId}
        onCreated={handleCreated}
      />

      <ArcadeFAB onClick={() => setNewTaskOpen(true)} />

      {/* Undo toast */}
      {undoToast && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
          style={{
            background: "var(--arc-panel-2)",
            border: "1px solid var(--arc-border-str)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              ✅ {undoToast.task.title.replace(/^\p{Emoji}\s*/u, "")}
            </p>
            <p className="text-[var(--arc-muted)] text-[10px]">Verdwijnt over {undoToast.remaining}s</p>
          </div>
          <button
            onClick={handleUndo}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--xp-accent), var(--accent-primary))",
              color: "white",
            }}
          >
            Ongedaan maken
          </button>
        </div>
      )}
    </div>
  );
}

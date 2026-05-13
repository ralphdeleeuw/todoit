"use client";

import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { Bell, Settings, Loader2 } from "lucide-react";
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

import { bucketTask, BUCKET_ORDER, calcLevel } from "@/lib/arcade";
import type { TaskWithRelations, ArcadeMember, CompleteResult } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MEMBER_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

export default function DashboardClient() {
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

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

  const activeTasks = (tasks ?? []).filter((t) => !t.completedAt);
  const filteredTasks = filterMemberId
    ? activeTasks.filter((t) => t.assignee?.id === filterMemberId)
    : activeTasks;

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

      try {
        const res = await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
        if (res.ok) {
          const data: CompleteResult = await res.json();
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
        }
      } catch {
        mutateTasks();
      }
    },
    [mutateTasks, mutateMembers, currentUserId]
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
          <div className="relative">
            <Bell className="w-5 h-5 text-[var(--arc-muted)]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />
          </div>
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
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}

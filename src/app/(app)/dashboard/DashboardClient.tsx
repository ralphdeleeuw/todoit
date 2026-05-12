"use client";

import { useState } from "react";
import useSWR from "swr";
import { TaskList } from "@/components/tasks/TaskList";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import type { TaskWithRelations } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardClient() {
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: tasks, isLoading: tasksLoading, mutate: mutateTasks } = useSWR<TaskWithRelations[]>(
    "/api/tasks?completed=false",
    fetcher
  );
  const { data: completedTasks, isLoading: completedLoading } = useSWR<TaskWithRelations[]>(
    showCompleted ? "/api/tasks?completed=true" : null,
    fetcher
  );
  const { data: members = [] } = useSWR("/api/family/members", fetcher, {
    onError: () => {},
  });
  const { data: lists = [] } = useSWR("/api/lists", fetcher);
  const { data: labels = [] } = useSWR("/api/labels", fetcher);
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);

  const currentUserId: string = sessionData?.user?.id ?? "";
  const isParent: boolean = sessionData?.user?.role === "PARENT";

  function handleCreated(task: TaskWithRelations) {
    mutateTasks((prev) => (prev ? [task, ...prev] : [task]), false);
  }

  function handleUpdated(updated: TaskWithRelations) {
    mutateTasks(
      (prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? [],
      false
    );
  }

  function handleDeleted(taskId: string) {
    mutateTasks((prev) => prev?.filter((t) => t.id !== taskId) ?? [], false);
  }

  function handleCompleted(taskId: string) {
    mutateTasks((prev) => prev?.filter((t) => t.id !== taskId) ?? [], false);
  }

  const activeTasks = tasks?.filter((t) => !t.completedAt) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mijn taken</h1>
          {!tasksLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {activeTasks.length === 0
                ? "Alles klaar!"
                : `${activeTasks.length} ${activeTasks.length === 1 ? "taak" : "taken"} openstaand`}
            </p>
          )}
        </div>
        <NewTaskButton
          members={members}
          lists={lists}
          labels={labels}
          isParent={isParent}
          currentUserId={currentUserId}
          onCreated={handleCreated}
          variant="button"
        />
      </div>

      {tasksLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <TaskList
          tasks={activeTasks}
          members={members}
          lists={lists}
          labels={labels}
          isParent={isParent}
          currentUserId={currentUserId}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          onCompleted={handleCompleted}
        />
      )}

      {/* Completed tasks toggle */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Voltooide taken
        </button>

        {showCompleted && (
          <div className="mt-3">
            {completedLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              </div>
            ) : completedTasks && completedTasks.length > 0 ? (
              <TaskList
                tasks={completedTasks}
                members={members}
                lists={lists}
                labels={labels}
                isParent={isParent}
                currentUserId={currentUserId}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onCompleted={() => {}}
              />
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                Geen voltooide taken
              </p>
            )}
          </div>
        )}
      </div>

      <NewTaskButton
        members={members}
        lists={lists}
        labels={labels}
        isParent={isParent}
        currentUserId={currentUserId}
        onCreated={handleCreated}
        variant="fab"
      />
    </div>
  );
}

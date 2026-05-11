"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { TaskList } from "@/components/tasks/TaskList";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { Loader2, List } from "lucide-react";
import type { TaskWithRelations } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PageProps {
  params: Promise<{ listId: string }>;
}

export default function ListPage({ params }: PageProps) {
  const { listId } = use(params);

  const { data: tasks, isLoading: tasksLoading, mutate: mutateTasks } = useSWR<TaskWithRelations[]>(
    `/api/tasks?listId=${listId}&completed=false`,
    fetcher
  );
  const { data: lists = [] } = useSWR<{ id: string; name: string; color: string | null }[]>(
    "/api/lists",
    fetcher
  );
  const { data: members = [] } = useSWR("/api/family/members", fetcher, {
    onError: () => {},
  });
  const { data: labels = [] } = useSWR("/api/labels", fetcher);
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);

  const currentUserId: string = sessionData?.user?.id ?? "";
  const isParent: boolean = sessionData?.user?.role === "PARENT";

  const currentList = lists.find((l) => l.id === listId);
  const activeTasks = tasks?.filter((t) => !t.completedAt) ?? [];

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {currentList?.color && (
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: currentList.color }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentList?.name ?? "Lijst"}
            </h1>
            {!tasksLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {activeTasks.length === 0
                  ? "Alles klaar!"
                  : `${activeTasks.length} ${activeTasks.length === 1 ? "taak" : "taken"} openstaand`}
              </p>
            )}
          </div>
        </div>
        <NewTaskButton
          members={members}
          lists={lists}
          labels={labels}
          isParent={isParent}
          currentUserId={currentUserId}
          defaultListId={listId}
          onCreated={handleCreated}
          variant="button"
        />
      </div>

      {/* Task list */}
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

      {/* Mobile FAB */}
      <NewTaskButton
        members={members}
        lists={lists}
        labels={labels}
        isParent={isParent}
        currentUserId={currentUserId}
        defaultListId={listId}
        onCreated={handleCreated}
        variant="fab"
      />
    </div>
  );
}

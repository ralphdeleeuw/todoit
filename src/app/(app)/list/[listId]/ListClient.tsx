"use client";

import { useState } from "react";
import useSWR from "swr";
import { TaskList } from "@/components/tasks/TaskList";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { AddExistingTaskDialog } from "@/components/tasks/AddExistingTaskDialog";
import { Loader2, ListPlus } from "lucide-react";
import type { TaskWithRelations } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ListClient({ listId }: { listId: string }) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: tasks, isLoading: tasksLoading, mutate: mutateTasks } = useSWR<TaskWithRelations[]>(
    `/api/tasks?listId=${listId}&completed=false`,
    fetcher
  );
  const { data: allTasks = [] } = useSWR<TaskWithRelations[]>(
    `/api/tasks?completed=false`,
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

  function handleAdded(addedTasks: TaskWithRelations[]) {
    mutateTasks((prev) => (prev ? [...addedTasks, ...prev] : addedTasks), false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Bestaande taak toevoegen aan deze lijst"
          >
            <ListPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Bestaande taak</span>
          </button>
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

      <AddExistingTaskDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        listId={listId}
        allTasks={allTasks}
        onAdded={handleAdded}
      />
    </div>
  );
}

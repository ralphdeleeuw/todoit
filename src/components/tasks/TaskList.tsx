"use client";

import { useMemo } from "react";
import { isToday, isThisWeek, isPast } from "date-fns";
import { ClipboardList } from "lucide-react";
import { TaskCard } from "./TaskCard";
import type { TaskWithRelations } from "@/types";

interface FamilyMember {
  id: string;
  name: string | null;
  image: string | null;
}

interface TaskList {
  id: string;
  name: string;
  color: string | null;
}

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskListProps {
  tasks: TaskWithRelations[];
  members: FamilyMember[];
  lists: TaskList[];
  labels: TaskLabel[];
  isParent: boolean;
  currentUserId: string;
  onUpdated: (task: TaskWithRelations) => void;
  onDeleted: (taskId: string) => void;
  onCompleted: (taskId: string) => void;
}

interface Group {
  label: string;
  tasks: TaskWithRelations[];
}

function groupTasks(tasks: TaskWithRelations[]): Group[] {
  const overdue: TaskWithRelations[] = [];
  const today: TaskWithRelations[] = [];
  const thisWeek: TaskWithRelations[] = [];
  const later: TaskWithRelations[] = [];
  const noDate: TaskWithRelations[] = [];

  for (const task of tasks) {
    if (!task.dueDate) {
      noDate.push(task);
    } else {
      const d = new Date(task.dueDate);
      if (isPast(d) && !isToday(d)) {
        overdue.push(task);
      } else if (isToday(d)) {
        today.push(task);
      } else if (isThisWeek(d, { weekStartsOn: 1 })) {
        thisWeek.push(task);
      } else {
        later.push(task);
      }
    }
  }

  const groups: Group[] = [];
  if (overdue.length) groups.push({ label: "Te laat", tasks: overdue });
  if (today.length) groups.push({ label: "Vandaag", tasks: today });
  if (thisWeek.length) groups.push({ label: "Deze week", tasks: thisWeek });
  if (later.length) groups.push({ label: "Later", tasks: later });
  if (noDate.length) groups.push({ label: "Geen datum", tasks: noDate });

  return groups;
}

export function TaskList({
  tasks,
  members,
  lists,
  labels,
  isParent,
  currentUserId,
  onUpdated,
  onDeleted,
  onCompleted,
}: TaskListProps) {
  const groups = useMemo(() => groupTasks(tasks), [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Geen taken
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Maak een nieuwe taak aan om te beginnen
        </p>
      </div>
    );
  }

  const cardProps = { members, lists, labels, isParent, currentUserId, onUpdated, onDeleted, onCompleted };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
            {group.label}
            <span className="ml-2 font-normal normal-case">({group.tasks.length})</span>
          </h3>
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <TaskCard key={task.id} task={task} {...cardProps} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

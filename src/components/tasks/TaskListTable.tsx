import Link from "next/link";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

import type { TaskPriority, TaskStatus } from "@prisma/client";

export type TaskListRow = {
  id: string;
  taskNumber: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  assignee: { name: string } | null;
  categories: { category: { id: string; name: string; color: string } }[];
};

export type SortKey =
  | "taskNumber"
  | "title"
  | "status"
  | "priority"
  | "dueDate"
  | "createdAt";

export type SortOrder = "asc" | "desc";

type TaskListTableProps = {
  tasks: TaskListRow[];
  projectId: string;
  projectKey: string;
  sortBy: SortKey;
  order: SortOrder;
  searchParamsString: string;
};

const columns: {
  key: SortKey | null;
  label: string;
  className?: string;
}[] = [
  { key: "taskNumber", label: "番号", className: "w-[110px]" },
  { key: "title", label: "タイトル" },
  { key: "status", label: "ステータス", className: "w-[140px]" },
  { key: "priority", label: "優先度", className: "w-[96px]" },
  { key: null, label: "担当者", className: "w-[140px]" },
  { key: "dueDate", label: "期限", className: "w-[110px]" },
  { key: null, label: "カテゴリ", className: "w-[180px]" },
  { key: "createdAt", label: "作成日", className: "w-[110px]" },
];

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  BACKLOG: { label: "Backlog", className: "bg-muted text-muted-foreground" },
  TODO: { label: "Todo", className: "bg-primary/10 text-primary" },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-warning/20 text-warning-foreground",
  },
  IN_REVIEW: {
    label: "In Review",
    className: "bg-primary/20 text-primary",
  },
  DONE: { label: "Done", className: "bg-success/20 text-success-foreground" },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  URGENT: { label: "緊急", className: "bg-danger text-danger-foreground" },
  HIGH: { label: "高", className: "bg-danger/70 text-danger-foreground" },
  MEDIUM: { label: "中", className: "bg-warning text-warning-foreground" },
  LOW: { label: "低", className: "bg-success text-success-foreground" },
  NONE: { label: "なし", className: "bg-muted text-muted-foreground" },
};

const buildSortHref = (
  currentSortBy: SortKey,
  currentOrder: SortOrder,
  targetKey: SortKey,
  searchParamsString: string,
): string => {
  const params = new URLSearchParams(searchParamsString);
  let nextOrder: SortOrder = "asc";
  if (currentSortBy === targetKey) {
    nextOrder = currentOrder === "asc" ? "desc" : "asc";
  }
  params.set("sortBy", targetKey);
  params.set("order", nextOrder);
  params.delete("page");
  return `?${params.toString()}`;
};

export const TaskListTable = ({
  tasks,
  projectId,
  projectKey,
  sortBy,
  order,
  searchParamsString,
}: TaskListTableProps) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            {columns.map((col) => {
              const isSortable = col.key !== null;
              const isActive = isSortable && sortBy === col.key;
              return (
                <th
                  key={col.label}
                  scope="col"
                  className={`px-3 py-2 font-medium ${col.className ?? ""}`}
                  aria-sort={
                    isActive
                      ? order === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {isSortable ? (
                    <Link
                      href={buildSortHref(
                        sortBy,
                        order,
                        col.key as SortKey,
                        searchParamsString,
                      )}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      scroll={false}
                    >
                      {col.label}
                      {isActive ? (
                        order === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </Link>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const status = statusConfig[task.status];
            const priority = priorityConfig[task.priority];
            return (
              <tr
                key={task.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2 text-muted-foreground">
                  <Link
                    href={`/projects/${projectId}/tasks/${task.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {projectKey}-{task.taskNumber}
                  </Link>
                </td>
                <td className="px-3 py-2 font-medium text-foreground">
                  <Link
                    href={`/projects/${projectId}/tasks/${task.id}`}
                    className="hover:underline"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${priority.className}`}
                  >
                    {priority.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {task.assignee ? (
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {task.assignee.name[0]}
                      </span>
                      <span className="truncate">{task.assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">未割り当て</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {task.dueDate ? format(new Date(task.dueDate), "yyyy/MM/dd") : "—"}
                </td>
                <td className="px-3 py-2">
                  {task.categories.length === 0 ? (
                    <span className="text-muted-foreground/60">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {task.categories.map(({ category }) => (
                        <span
                          key={category.id}
                          className="inline-flex rounded px-1.5 py-0.5 text-xs text-foreground"
                          style={{ backgroundColor: `${category.color}33` }}
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {format(new Date(task.createdAt), "yyyy/MM/dd")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

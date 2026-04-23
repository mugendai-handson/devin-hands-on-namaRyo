"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

import type { TaskPriority, TaskStatus } from "@prisma/client";

type Member = {
  userId: string;
  user: { id: string; name: string };
};

type Category = {
  id: string;
  name: string;
  color: string;
};

type TaskListFiltersProps = {
  members: Member[];
  categories: Category[];
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "URGENT", label: "緊急" },
  { value: "HIGH", label: "高" },
  { value: "MEDIUM", label: "中" },
  { value: "LOW", label: "低" },
  { value: "NONE", label: "なし" },
];

export const TaskListFilters = ({ members, categories }: TaskListFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = (params: URLSearchParams) => {
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.replace(url);
    });
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // フィルター変更時はページをリセット
    params.delete("page");
    navigate(params);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    const sortBy = searchParams.get("sortBy");
    const order = searchParams.get("order");
    if (sortBy) params.set("sortBy", sortBy);
    if (order) params.set("order", order);
    navigate(params);
  };

  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const assigneeId = searchParams.get("assigneeId") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";

  const hasActiveFilter =
    status !== "" || priority !== "" || assigneeId !== "" || categoryId !== "";

  const selectClassName =
    "rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-busy={isPending}
    >
      <select
        aria-label="ステータスで絞り込み"
        value={status}
        disabled={isPending}
        onChange={(e) => updateParam("status", e.target.value)}
        className={selectClassName}
      >
        <option value="">すべてのステータス</option>
        {statusOptions.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        aria-label="優先度で絞り込み"
        value={priority}
        disabled={isPending}
        onChange={(e) => updateParam("priority", e.target.value)}
        className={selectClassName}
      >
        <option value="">すべての優先度</option>
        {priorityOptions.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <select
        aria-label="担当者で絞り込み"
        value={assigneeId}
        disabled={isPending}
        onChange={(e) => updateParam("assigneeId", e.target.value)}
        className={selectClassName}
      >
        <option value="">すべての担当者</option>
        <option value="unassigned">未割り当て</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.user.name}
          </option>
        ))}
      </select>

      <select
        aria-label="カテゴリで絞り込み"
        value={categoryId}
        disabled={isPending}
        onChange={(e) => updateParam("categoryId", e.target.value)}
        className={selectClassName}
      >
        <option value="">すべてのカテゴリ</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={clearAll}
          disabled={isPending}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X size={12} />
          クリア
        </button>
      )}
    </div>
  );
};

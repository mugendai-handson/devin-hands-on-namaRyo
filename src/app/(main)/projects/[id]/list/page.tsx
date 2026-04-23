import Link from "next/link";
import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskListFilters } from "@/components/tasks/TaskListFilters";
import { TaskListTable } from "@/components/tasks/TaskListTable";

import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import type { SortKey, SortOrder } from "@/components/tasks/TaskListTable";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;

const VALID_SORT_KEYS: readonly SortKey[] = [
  "taskNumber",
  "title",
  "status",
  "priority",
  "dueDate",
  "createdAt",
] as const;

const VALID_STATUSES: readonly TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;

const VALID_PRIORITIES: readonly TaskPriority[] = [
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NONE",
] as const;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const parseSortKey = (value: string | undefined): SortKey =>
  VALID_SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "createdAt";

const parseSortOrder = (value: string | undefined): SortOrder =>
  value === "asc" ? "asc" : "desc";

const parseStatus = (value: string | undefined): TaskStatus | undefined =>
  VALID_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : undefined;

const parsePriority = (value: string | undefined): TaskPriority | undefined =>
  VALID_PRIORITIES.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : undefined;

const parsePage = (value: string | undefined): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return 1;
  return n;
};

const buildOrderBy = (
  sortBy: SortKey,
  order: SortOrder,
): Prisma.TaskOrderByWithRelationInput[] => {
  if (sortBy === "dueDate") {
    // NULL を末尾に寄せる
    return [{ dueDate: { sort: order, nulls: "last" } }, { createdAt: "desc" }];
  }
  return [{ [sortBy]: order } as Prisma.TaskOrderByWithRelationInput];
};

const buildSearchParamsString = (
  params: Record<string, string | string[] | undefined>,
): string => {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = first(value);
    if (v !== undefined && v !== "") usp.set(key, v);
  }
  return usp.toString();
};

const ListPage = async ({ params, searchParams }: Props) => {
  const { id: projectId } = await params;
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!project) notFound();

  const currentMember = project.members.find((m) => m.userId === session.user!.id);
  if (!currentMember) notFound();

  const sortBy = parseSortKey(first(sp.sortBy));
  const order = parseSortOrder(first(sp.order));
  const status = parseStatus(first(sp.status));
  const priority = parsePriority(first(sp.priority));
  const assigneeParam = first(sp.assigneeId);
  const categoryId = first(sp.categoryId);
  const page = parsePage(first(sp.page));

  const where: Prisma.TaskWhereInput = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeParam === "unassigned") {
    where.assigneeId = null;
  } else if (assigneeParam) {
    where.assigneeId = assigneeParam;
  }
  if (categoryId) {
    where.categories = { some: { categoryId } };
  }

  const [categories, totalCount, tasks] = await Promise.all([
    prisma.category.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    }),
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { name: true } },
        categories: {
          include: {
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: buildOrderBy(sortBy, order),
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const canCreate = currentMember.role !== "VIEWER";
  const searchParamsString = buildSearchParamsString(sp);

  const pagerParams = (targetPage: number): string => {
    const usp = new URLSearchParams(searchParamsString);
    if (targetPage <= 1) {
      usp.delete("page");
    } else {
      usp.set("page", String(targetPage));
    }
    const qs = usp.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground">タスク一覧</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher projectId={projectId} active="list" />
          {canCreate && (
            <CreateTaskDialog
              projectId={projectId}
              members={project.members}
              categories={categories}
            />
          )}
        </div>
      </div>

      <TaskListFilters members={project.members} categories={categories} />

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <Inbox size={32} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">タスクが見つかりません</p>
            <p className="mt-1 text-xs text-muted-foreground">
              条件を変更するか、新しいタスクを作成してください。
            </p>
          </div>
        </div>
      ) : (
        <>
          <TaskListTable
            tasks={tasks}
            projectId={projectId}
            projectKey={project.key}
            sortBy={sortBy}
            order={order}
            searchParamsString={searchParamsString}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {totalCount} 件中 {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, totalCount)} 件を表示
            </span>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={pagerParams(currentPage - 1)}
                  className="rounded-md border border-border px-3 py-1 text-foreground hover:bg-muted"
                  scroll={false}
                >
                  前へ
                </Link>
              ) : (
                <span className="rounded-md border border-border px-3 py-1 opacity-50">
                  前へ
                </span>
              )}
              <span>
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={pagerParams(currentPage + 1)}
                  className="rounded-md border border-border px-3 py-1 text-foreground hover:bg-muted"
                  scroll={false}
                >
                  次へ
                </Link>
              ) : (
                <span className="rounded-md border border-border px-3 py-1 opacity-50">
                  次へ
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ListPage;

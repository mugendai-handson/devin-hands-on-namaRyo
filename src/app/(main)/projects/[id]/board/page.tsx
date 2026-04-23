import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CategoryFilter } from "@/components/board/CategoryFilter";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";
import { categoryFilterModeSchema } from "@/lib/validations/task";

import type { Prisma } from "@prisma/client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ categories?: string; categoryMode?: string }>;
};

const parseCategoryIds = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const BoardPage = async ({ params, searchParams }: Props) => {
  const { id: projectId } = await params;
  const { categories: categoriesParam, categoryMode: categoryModeParam } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
      categories: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!project) notFound();

  const currentMember = project.members.find((m) => m.userId === session.user!.id);
  if (!currentMember) notFound();

  // フィルター条件をパース（プロジェクトに属する ID のみ採用）
  const requestedIds = parseCategoryIds(categoriesParam);
  const validCategoryIds = requestedIds.filter((id) =>
    project.categories.some((c) => c.id === id),
  );
  // 不正値は default("or") にフォールバックさせる（500 を避けるため safeParse）
  const parsedMode = categoryFilterModeSchema.safeParse(categoryModeParam ?? undefined);
  const mode = parsedMode.success ? parsedMode.data : "or";

  const categoryWhere: Prisma.TaskWhereInput | undefined =
    validCategoryIds.length === 0
      ? undefined
      : mode === "and"
        ? {
            AND: validCategoryIds.map((categoryId) => ({
              categories: { some: { categoryId } },
            })),
          }
        : {
            categories: { some: { categoryId: { in: validCategoryIds } } },
          };

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(categoryWhere ?? {}),
    },
    include: {
      assignee: { select: { name: true } },
      categories: {
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const tasksForBoard = tasks.map((t) => ({
    id: t.id,
    taskNumber: t.taskNumber,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    assignee: t.assignee,
    categories: t.categories.map((tc) => tc.category),
  }));

  const canCreate = currentMember.role !== "VIEWER";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground">カンバンボード</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher projectId={projectId} active="board" />
          {canCreate && (
            <CreateTaskDialog
              projectId={projectId}
              members={project.members}
              categories={project.categories}
            />
          )}
        </div>
      </div>

      <CategoryFilter categories={project.categories} />

      <KanbanBoard tasks={tasksForBoard} projectKey={project.key} />
    </div>
  );
};
export default BoardPage;

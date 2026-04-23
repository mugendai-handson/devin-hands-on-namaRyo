"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createTaskSchema } from "@/lib/validations/task";

export type TaskFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
} | null;

export const createTask = async (
  projectId: string,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "認証が必要です" };
  }

  // プロジェクトメンバー & 権限チェック（API ルートと同じルール）
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });
  if (!member || member.role === "VIEWER") {
    return { error: "タスクを作成する権限がありません" };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "BACKLOG",
    priority: formData.get("priority") || "NONE",
    assigneeId: formData.get("assigneeId") || null,
    dueDate: formData.get("dueDate") || null,
    categoryIds: formData.getAll("categoryIds").map((v) => String(v)).filter(Boolean),
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // プロジェクトに属するカテゴリのみに限定
  const validCategoryIds =
    parsed.data.categoryIds.length > 0
      ? (
          await prisma.category.findMany({
            where: { id: { in: parsed.data.categoryIds }, projectId },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

  // 連番採番
  const lastTask = await prisma.task.findFirst({
    where: { projectId },
    orderBy: { taskNumber: "desc" },
    select: { taskNumber: true },
  });
  const nextNumber = (lastTask?.taskNumber ?? 0) + 1;

  await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      projectId,
      reporterId: session.user.id,
      taskNumber: nextNumber,
      categories: {
        create: validCategoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });

  revalidatePath(`/projects/${projectId}/board`);
  return { success: true };
};

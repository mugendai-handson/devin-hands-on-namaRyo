"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createProjectSchema,
  updateProjectSchema,
  generateProjectKey,
} from "@/lib/validations/project";

export type ProjectFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  projectId?: string;
} | null;

/**
 * プロジェクトを作成し、作成者を OWNER として登録する。
 * 成功時は /projects/[id]/board へリダイレクトする。
 */
export const createProject = async (
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "認証が必要です" };
  }

  const rawName = String(formData.get("name") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "").trim();
  const rawKey = String(formData.get("key") ?? "").trim();

  const raw = {
    name: rawName,
    description: rawDescription.length === 0 ? null : rawDescription,
    key: rawKey.length === 0 ? undefined : rawKey.toUpperCase(),
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const key = parsed.data.key ?? generateProjectKey(parsed.data.name);

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      key,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    select: { id: true },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}/board`);
};

/**
 * プロジェクトを更新する（OWNER / ADMIN のみ）。
 */
export const updateProject = async (
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "認証が必要です" };
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
    select: { role: true },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return { error: "プロジェクトを更新する権限がありません" };
  }

  const rawName = String(formData.get("name") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "").trim();
  const rawKey = String(formData.get("key") ?? "").trim();

  const raw = {
    name: rawName,
    description: rawDescription.length === 0 ? null : rawDescription,
    key: rawKey.length === 0 ? undefined : rawKey.toUpperCase(),
  };

  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.key !== undefined && { key: parsed.data.key }),
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}/board`);
  return { success: true, projectId };
};

/**
 * プロジェクトを削除する（OWNER のみ）。
 * 成功時は /projects へリダイレクトする。
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("認証が必要です");
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
    select: { role: true },
  });
  if (!member || member.role !== "OWNER") {
    throw new Error("プロジェクトを削除する権限がありません");
  }

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  redirect("/projects");
};

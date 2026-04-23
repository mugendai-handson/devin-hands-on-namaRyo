import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProjectSettingsForm } from "@/components/projects/ProjectSettingsForm";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { CategoryManager } from "@/components/categories/CategoryManager";

type Props = {
  params: Promise<{ id: string }>;
};

const roleLabel: Record<string, string> = {
  OWNER: "オーナー",
  ADMIN: "管理者",
  MEMBER: "メンバー",
  VIEWER: "閲覧のみ",
};

const ProjectSettingsPage = async ({ params }: Props) => {
  const { id: projectId } = await params;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const [project, currentMember] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
        categories: {
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
    }),
  ]);

  if (!project || !currentMember) notFound();

  const canEdit = currentMember.role === "OWNER" || currentMember.role === "ADMIN";
  const canDelete = currentMember.role === "OWNER";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href={`/projects/${projectId}/board`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          カンバンボードへ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">プロジェクト設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.name}（{project.key}）· あなたのロール:{" "}
          {roleLabel[currentMember.role] ?? currentMember.role}
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-base font-semibold text-foreground">基本情報</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {canEdit
            ? "プロジェクト名・キー・説明を編集できます。"
            : "プロジェクト情報は閲覧のみ可能です。編集は OWNER / ADMIN に依頼してください。"}
        </p>
        <ProjectSettingsForm
          projectId={projectId}
          defaultName={project.name}
          defaultKey={project.key}
          defaultDescription={project.description}
          canEdit={canEdit}
        />
      </section>

      <CategoryManager
        projectId={project.id}
        initialCategories={project.categories}
        canEdit={canEdit}
      />

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-base font-semibold text-foreground">メンバー</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          参加中のメンバー一覧です。招待や権限変更は別画面で行います。
        </p>
        <ul className="divide-y divide-border">
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {m.user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.user.email}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {roleLabel[m.role] ?? m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {canDelete && (
        <section className="rounded-lg border border-danger/40 bg-card p-6">
          <h2 className="mb-1 text-base font-semibold text-danger">危険な操作</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            プロジェクトを削除すると関連するタスク・コメント・添付ファイルがすべて失われます。この操作は取り消せません。
          </p>
          <DeleteProjectButton
            projectId={projectId}
            projectName={project.name}
          />
        </section>
      )}
    </div>
  );
};
export default ProjectSettingsPage;

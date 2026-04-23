import Link from "next/link";
import { FolderKanban, Plus, Settings, Crown } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const roleLabel: Record<string, string> = {
  OWNER: "オーナー",
  ADMIN: "管理者",
  MEMBER: "メンバー",
  VIEWER: "閲覧のみ",
};

const ProjectsPage = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { tasks: true, members: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">プロジェクト</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            参加中のプロジェクトを一覧で確認できます
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} />
          プロジェクトを作成
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <FolderKanban size={32} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            参加中のプロジェクトはありません
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus size={16} />
            最初のプロジェクトを作成
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ project, role }) => {
            const canManage = role === "OWNER" || role === "ADMIN";
            return (
              <div
                key={project.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <Link href={`/projects/${project.id}/board`} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FolderKanban size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-card-foreground">
                      {project.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {project.key}
                    </p>
                  </div>
                </Link>

                {project.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Crown size={12} />
                    {project.owner.name}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                    aria-label="自分のロール"
                  >
                    {roleLabel[role] ?? role}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>タスク {project._count.tasks}</span>
                    <span>メンバー {project._count.members}</span>
                  </div>
                  {canManage && (
                    <Link
                      href={`/projects/${project.id}/settings`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      aria-label="プロジェクト設定"
                    >
                      <Settings size={14} />
                      設定
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ProjectsPage;

import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

type Props = {
  params: Promise<{ id: string }>;
};

const BoardPage = async ({ params }: Props) => {
  const { id: projectId } = await params;
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

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const canCreate = currentMember.role !== "VIEWER";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground">カンバンボード</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}/settings`}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            <Settings size={16} />
            設定
          </Link>
          {canCreate && (
            <CreateTaskDialog projectId={projectId} members={project.members} />
          )}
        </div>
      </div>

      <KanbanBoard tasks={tasks} projectKey={project.key} />
    </div>
  );
};
export default BoardPage;

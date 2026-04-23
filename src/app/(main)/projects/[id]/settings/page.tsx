import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CategoryManager } from "@/components/categories/CategoryManager";

type Props = {
  params: Promise<{ id: string }>;
};

const ProjectSettingsPage = async ({ params }: Props) => {
  const { id: projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
      categories: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!project || project.members.length === 0) notFound();

  const role = project.members[0].role;
  const canEdit = role === "OWNER" || role === "ADMIN";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
        <p className="text-sm text-muted-foreground">プロジェクト設定</p>
      </div>

      <CategoryManager
        projectId={project.id}
        initialCategories={project.categories}
        canEdit={canEdit}
      />
    </div>
  );
};
export default ProjectSettingsPage;

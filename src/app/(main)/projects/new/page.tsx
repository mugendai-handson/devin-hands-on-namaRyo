import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { ProjectForm } from "@/components/projects/ProjectForm";

const NewProjectPage = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          プロジェクト一覧へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">プロジェクトを作成</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          プロジェクト名と説明を入力します。作成者が自動的に OWNER になります。
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <ProjectForm />
      </div>
    </div>
  );
};
export default NewProjectPage;

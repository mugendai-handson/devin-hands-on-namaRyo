"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { deleteProject } from "@/lib/actions/project";

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
};

export const DeleteProjectButton = ({
  projectId,
  projectName,
}: DeleteProjectButtonProps) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteProject(projectId);
      } catch (error) {
        if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "削除に失敗しました";
        toast.error(message);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-medium text-danger-foreground hover:opacity-90"
      >
        <Trash2 size={16} />
        プロジェクトを削除
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h2 id="delete-dialog-title" className="text-base font-semibold text-foreground">
                  プロジェクトを削除しますか？
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  「{projectName}」と関連するすべてのタスク・コメント・添付ファイルが削除されます。この操作は元に戻せません。
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  確認のためプロジェクト名を入力してください。
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={projectName}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || confirmText !== projectName}
                className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-danger-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

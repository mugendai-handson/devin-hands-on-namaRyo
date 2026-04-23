"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateProject } from "@/lib/actions/project";

import type { ProjectFormState } from "@/lib/actions/project";

type ProjectSettingsFormProps = {
  projectId: string;
  defaultName: string;
  defaultKey: string;
  defaultDescription: string | null;
  canEdit: boolean;
};

export const ProjectSettingsForm = ({
  projectId,
  defaultName,
  defaultKey,
  defaultDescription,
  canEdit,
}: ProjectSettingsFormProps) => {
  const boundAction = updateProject.bind(null, projectId);
  const [state, formAction, isPending] = useActionState<ProjectFormState, FormData>(
    boundAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("プロジェクト情報を更新しました");
    }
  }, [state?.success]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
          プロジェクト名 <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={defaultName}
          disabled={!canEdit}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
        {state?.fieldErrors?.name && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="key" className="mb-1 block text-sm font-medium text-foreground">
          プロジェクトキー
        </label>
        <input
          id="key"
          name="key"
          type="text"
          maxLength={10}
          defaultValue={defaultKey}
          disabled={!canEdit}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
        {state?.fieldErrors?.key && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.key[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={1000}
          defaultValue={defaultDescription ?? ""}
          disabled={!canEdit}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
        {state?.fieldErrors?.description && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "保存中..." : "変更を保存"}
          </button>
        </div>
      )}
    </form>
  );
};

"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProject } from "@/lib/actions/project";
import { generateProjectKey } from "@/lib/validations/project";

import type { ProjectFormState } from "@/lib/actions/project";

export const ProjectForm = () => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ProjectFormState, FormData>(
    createProject,
    null,
  );

  const [name, setName] = useState("");
  const [keyOverride, setKeyOverride] = useState<string | null>(null);
  const key = keyOverride ?? generateProjectKey(name);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state?.error]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
          {state.error}
        </div>
      )}

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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Devin Task Board"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
          value={key}
          onChange={(e) => setKeyOverride(e.target.value.toUpperCase())}
          placeholder="DTB"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          タスク識別子の接頭辞（例: DTB-1）。名前から自動生成されますが編集できます。
        </p>
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
          rows={4}
          maxLength={1000}
          placeholder="このプロジェクトの目的や範囲を記入"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {state?.fieldErrors?.description && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "作成中..." : "プロジェクトを作成"}
        </button>
      </div>
    </form>
  );
};

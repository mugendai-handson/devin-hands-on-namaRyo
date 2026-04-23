import { z } from "zod";

const projectKeySchema = z
  .string()
  .min(2, "キーは2文字以上で入力してください")
  .max(10, "キーは10文字以内で入力してください")
  .regex(/^[A-Z][A-Z0-9]*$/, "キーは英大文字で始まり英大文字または数字のみ使用できます");

export const createProjectSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").max(100, "プロジェクト名は100文字以内で入力してください"),
  description: z.string().max(1000, "説明は1000文字以内で入力してください").optional().nullable(),
  key: projectKeySchema.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").max(100, "プロジェクト名は100文字以内で入力してください").optional(),
  description: z.string().max(1000, "説明は1000文字以内で入力してください").optional().nullable(),
  key: projectKeySchema.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * プロジェクト名からキーを自動生成する
 * 例: "Devin Task Board" → "DTB"
 */
export const generateProjectKey = (name: string): string => {
  const normalized = name.trim();
  if (!normalized) return "";
  const words = normalized.split(/\s+/);
  const raw =
    words.length >= 2
      ? words.map((w) => w[0]).join("")
      : normalized.slice(0, 3);
  const sanitized = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return sanitized.slice(0, 5) || "PRJ";
};

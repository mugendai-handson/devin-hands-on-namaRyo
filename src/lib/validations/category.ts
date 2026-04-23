import { z } from "zod";

const oklchColorSchema = z
  .string()
  .min(1, "カラーは必須です")
  .regex(
    /^oklch\(\s*[0-9.]+\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+%?)?\s*\)$/,
    "OKLCH 形式のカラー値を指定してください（例: oklch(0.55 0.22 27)）",
  );

export const createCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です"),
  color: oklchColorSchema,
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(1, "カテゴリ名は必須です").optional(),
    color: oklchColorSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.color !== undefined, {
    message: "更新内容を指定してください",
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

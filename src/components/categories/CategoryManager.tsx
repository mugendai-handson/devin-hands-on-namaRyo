"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  color: string;
  projectId: string;
};

type CategoryManagerProps = {
  projectId: string;
  initialCategories: Category[];
  canEdit: boolean;
};

const DEFAULT_COLOR = "oklch(0.55 0.1 230)";

export const CategoryManager = ({
  projectId,
  initialCategories,
  canEdit,
}: CategoryManagerProps) => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isPending, startTransition] = useTransition();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("カテゴリ名は必須です");
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body?.error?.message ?? "作成に失敗しました");
        return;
      }
      setCategories((prev) => [...prev, body.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewColor(DEFAULT_COLOR);
      setCreating(false);
      toast.success("カテゴリを作成しました");
      refresh();
    } catch {
      toast.error("ネットワークエラーが発生しました");
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const handleUpdate = async (categoryId: string) => {
    if (!editName.trim()) {
      toast.error("カテゴリ名は必須です");
      return;
    }
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body?.error?.message ?? "更新に失敗しました");
        return;
      }
      setCategories((prev) =>
        prev
          .map((c) => (c.id === categoryId ? body.data : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      cancelEdit();
      toast.success("カテゴリを更新しました");
      refresh();
    } catch {
      toast.error("ネットワークエラーが発生しました");
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`カテゴリ「${category.name}」を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error?.message ?? "削除に失敗しました");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success("カテゴリを削除しました");
      refresh();
    } catch {
      toast.error("ネットワークエラーが発生しました");
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">カテゴリ</h2>
        {canEdit && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus size={14} />
            新規作成
          </button>
        )}
      </div>

      {canEdit && creating && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-background p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="カテゴリ名"
            className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-sm"
            aria-label="カテゴリ名"
          />
          <input
            type="text"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="oklch(0.55 0.22 27)"
            className="w-64 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs"
            aria-label="カラー（OKLCH）"
          />
          <span
            aria-hidden
            className="inline-block h-6 w-6 rounded-full border border-border"
            style={{ backgroundColor: newColor }}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            作成
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName("");
              setNewColor(DEFAULT_COLOR);
            }}
            className="rounded-md border border-border px-3 py-1 text-sm text-foreground hover:bg-muted"
          >
            キャンセル
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">カテゴリはまだありません。</p>
      ) : (
        <ul className="divide-y divide-border">
          {categories.map((category) => {
            const isEditing = editingId === category.id;
            return (
              <li key={category.id} className="flex items-center gap-3 py-2">
                <span
                  aria-hidden
                  className="inline-block h-5 w-5 flex-shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: isEditing ? editColor : category.color }}
                />
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-sm"
                      aria-label="カテゴリ名"
                    />
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-64 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs"
                      aria-label="カラー（OKLCH）"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdate(category.id)}
                      disabled={isPending}
                      className="rounded-md p-1.5 text-success hover:bg-muted disabled:opacity-60"
                      aria-label="保存"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label="キャンセル"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-card-foreground">{category.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{category.color}</span>
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                          aria-label="編集"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          className="rounded-md p-1.5 text-danger hover:bg-muted"
                          aria-label="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!canEdit && (
        <p className="mt-3 text-xs text-muted-foreground">
          カテゴリの編集は OWNER または ADMIN のみ可能です。
        </p>
      )}
    </section>
  );
};

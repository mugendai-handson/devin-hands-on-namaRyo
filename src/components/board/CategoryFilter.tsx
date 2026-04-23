"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  color: string;
};

type CategoryFilterProps = {
  categories: Category[];
};

const buildQuery = (params: URLSearchParams): string => {
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const parseCategoryIds = (value: string | null): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export const CategoryFilter = ({ categories }: CategoryFilterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 選択状態・モードは URL から都度導出し、連打時に stale な prop を参照しないようにする
  const categoryIdSet = new Set(categories.map((c) => c.id));
  const selectedIds = parseCategoryIds(searchParams.get("categories")).filter((id) =>
    categoryIdSet.has(id),
  );
  const modeParam = searchParams.get("categoryMode");
  const mode: "and" | "or" = modeParam === "and" ? "and" : "or";

  const updateParams = (next: URLSearchParams) => {
    router.replace(`${pathname}${buildQuery(next)}`, { scroll: false });
  };

  const toggleCategory = (id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const set = new Set(selectedIds);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }

    if (set.size === 0) {
      next.delete("categories");
      next.delete("categoryMode");
    } else {
      next.set("categories", Array.from(set).join(","));
      if (!next.get("categoryMode")) {
        next.set("categoryMode", mode);
      }
    }

    updateParams(next);
  };

  const setMode = (nextMode: "and" | "or") => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("categoryMode", nextMode);
    updateParams(next);
  };

  const clear = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("categories");
    next.delete("categoryMode");
    updateParams(next);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">カテゴリ:</span>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity ${
                isSelected
                  ? "text-white"
                  : "border border-border bg-background text-foreground hover:bg-muted"
              }`}
              style={isSelected ? { backgroundColor: cat.color } : undefined}
              aria-pressed={isSelected}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${isSelected ? "bg-white/70" : ""}`}
                style={isSelected ? undefined : { backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>

      {selectedIds.length > 1 && (
        <div className="ml-auto flex items-center gap-1 rounded-md border border-border bg-background p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("or")}
            className={`rounded px-2 py-0.5 ${
              mode === "or"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
            aria-pressed={mode === "or"}
          >
            OR
          </button>
          <button
            type="button"
            onClick={() => setMode("and")}
            className={`rounded px-2 py-0.5 ${
              mode === "and"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
            aria-pressed={mode === "and"}
          >
            AND
          </button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted ${
            selectedIds.length > 1 ? "" : "ml-auto"
          }`}
        >
          <X size={12} />
          クリア
        </button>
      )}
    </div>
  );
};

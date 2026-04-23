import Link from "next/link";
import { Kanban, List } from "lucide-react";

type ViewSwitcherProps = {
  projectId: string;
  active: "board" | "list";
};

const views = [
  { key: "board" as const, label: "カンバン", icon: Kanban, hrefSuffix: "board" },
  { key: "list" as const, label: "リスト", icon: List, hrefSuffix: "list" },
];

export const ViewSwitcher = ({ projectId, active }: ViewSwitcherProps) => {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
      {views.map((v) => {
        const Icon = v.icon;
        const isActive = v.key === active;
        return (
          <Link
            key={v.key}
            href={`/projects/${projectId}/${v.hrefSuffix}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {v.label}
          </Link>
        );
      })}
    </div>
  );
};

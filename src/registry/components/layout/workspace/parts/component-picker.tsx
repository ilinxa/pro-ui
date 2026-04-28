"use client";

import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkspaceComponent } from "../types";

type Group = {
  category: string;
  items: WorkspaceComponent[];
};

function groupByCategory(components: WorkspaceComponent[]): Group[] {
  const map = new Map<string, WorkspaceComponent[]>();
  for (const c of components) {
    const key = c.category ?? "";
    const list = map.get(key) ?? [];
    list.push(c);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export function ComponentPicker({
  components,
  currentId,
  onSelect,
  className,
}: {
  components: WorkspaceComponent[];
  currentId: string;
  onSelect: (componentId: string) => void;
  className?: string;
}) {
  const current = components.find((c) => c.id === currentId);
  const groups = groupByCategory(components);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        aria-label={`Change component (current: ${current?.name ?? currentId})`}
      >
        {current?.icon ? (
          <span className="inline-flex size-3 items-center justify-center text-muted-foreground">
            {current.icon}
          </span>
        ) : null}
        <span className="truncate">{current?.name ?? "—"}</span>
        <ChevronDownIcon className="size-3 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {groups.map((group, gi) => (
          <div key={group.category || `__${gi}`}>
            {group.category ? (
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {group.category}
              </DropdownMenuLabel>
            ) : null}
            {group.items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => onSelect(item.id)}
                className="text-xs"
              >
                {item.icon ? (
                  <span className="mr-2 inline-flex size-3 items-center justify-center text-muted-foreground">
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.name}</span>
              </DropdownMenuItem>
            ))}
            {gi < groups.length - 1 ? <DropdownMenuSeparator /> : null}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

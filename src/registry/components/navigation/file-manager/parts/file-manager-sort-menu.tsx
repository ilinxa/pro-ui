"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";
import type { FileManagerSortKey } from "../types";

export function FileManagerSortMenu() {
  const { actions, state, labels } = useFileManager();
  const sortKeys: { key: FileManagerSortKey; label: string }[] = [
    { key: "name", label: labels.sortByName },
    { key: "modified", label: labels.sortByModified },
    { key: "size", label: labels.sortBySize },
    { key: "type", label: labels.sortByType },
  ];

  // F-cross-13: no `asChild` — Base UI triggers reject it. The Tooltip wrapper
  // is dropped: TooltipTrigger renders its own <button> in both backends, and
  // nesting it with DropdownMenuTrigger would need asChild/render to fuse them
  // into one element. `title` keeps a hover affordance natively.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7")}
        aria-label={`Sort by ${state.sort.key}`}
        title="Sort"
      >
        <ArrowUpDown className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        {sortKeys.map(({ key, label }) => (
          <DropdownMenuItem
            key={key}
            onSelect={() =>
              actions.setSort({
                key,
                order:
                  state.sort.key === key && state.sort.order === "asc"
                    ? "desc"
                    : "asc",
              })
            }
          >
            {state.sort.key === key ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <span aria-hidden="true" className="size-3.5" />
            )}
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            actions.setSort({
              key: state.sort.key,
              order: state.sort.order === "asc" ? "desc" : "asc",
            })
          }
        >
          {state.sort.order === "asc" ? (
            <ArrowUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden="true" />
          )}
          {state.sort.order === "asc" ? labels.sortAsc : labels.sortDesc}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Sort by ${state.sort.key}`}
            >
              <ArrowUpDown className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Sort</TooltipContent>
      </Tooltip>
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

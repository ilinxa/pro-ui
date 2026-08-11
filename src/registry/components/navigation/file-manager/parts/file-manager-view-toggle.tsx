"use client";

import { LayoutGrid, List } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";
import type { FileManagerViewMode } from "../types";

/**
 * Plain-button segmented control. Deliberately NOT shadcn ToggleGroup — its
 * value model diverges between Radix (single: string) and Base UI (string[]),
 * an F-cross-13 carrier (event-calendar v0.2.1 precedent; toggle-group dep
 * dropped). Each segment is the TooltipTrigger itself — no `asChild`, which
 * Base UI triggers reject.
 */
export function FileManagerViewToggle() {
  const { actions, state, labels } = useFileManager();
  const modes: Array<{
    mode: FileManagerViewMode;
    label: string;
    Icon: typeof LayoutGrid;
  }> = [
    { mode: "grid", label: labels.viewGrid, Icon: LayoutGrid },
    { mode: "list", label: labels.viewList, Icon: List },
  ];
  return (
    <div role="group" className="flex shrink-0 items-center">
      {modes.map(({ mode, label, Icon }) => (
        <Tooltip key={mode}>
          <TooltipTrigger
            type="button"
            aria-pressed={state.viewMode === mode}
            aria-label={label}
            onClick={() => actions.setViewMode(mode)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-7 rounded-none first:rounded-l-lg last:rounded-r-lg",
              state.viewMode === mode && "bg-muted",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

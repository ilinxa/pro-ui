"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentPicker } from "./component-picker";
import type { WorkspaceComponent } from "../types";

export function AreaHeader({
  components,
  currentId,
  onSelectComponent,
  onSplitVertical,
  onSplitHorizontal,
  onMergeDirection,
  canSplit,
  mergeOptions,
  className,
}: {
  components: WorkspaceComponent[];
  currentId: string;
  onSelectComponent: (componentId: string) => void;
  onSplitVertical: () => void;
  onSplitHorizontal: () => void;
  onMergeDirection: (direction: "left" | "right" | "up" | "down") => void;
  canSplit: boolean;
  mergeOptions: { left: boolean; right: boolean; up: boolean; down: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-7 items-center justify-between border-b border-border bg-card px-2",
        className,
      )}
    >
      <ComponentPicker
        components={components}
        currentId={currentId}
        onSelect={onSelectComponent}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Area actions"
          className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronsUpDownIcon className="size-3" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Split
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!canSplit}
            onSelect={onSplitVertical}
            className="text-xs"
          >
            Split vertical
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canSplit}
            onSelect={onSplitHorizontal}
            className="text-xs"
          >
            Split horizontal
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={
                !mergeOptions.left &&
                !mergeOptions.right &&
                !mergeOptions.up &&
                !mergeOptions.down
              }
              className="text-xs"
            >
              Merge with neighbor
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-32">
              <DropdownMenuItem
                disabled={!mergeOptions.up}
                onSelect={() => onMergeDirection("up")}
                className="text-xs"
              >
                Up
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!mergeOptions.down}
                onSelect={() => onMergeDirection("down")}
                className="text-xs"
              >
                Down
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!mergeOptions.left}
                onSelect={() => onMergeDirection("left")}
                className="text-xs"
              >
                Left
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!mergeOptions.right}
                onSelect={() => onMergeDirection("right")}
                className="text-xs"
              >
                Right
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

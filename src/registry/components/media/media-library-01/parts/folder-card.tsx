"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "../lib/format";
import type { MediaNode } from "../types";

export interface FolderCardProps extends HTMLAttributes<HTMLDivElement> {
  node: MediaNode;
  selected?: boolean;
  /** Number of items inside, when known. */
  itemCount?: number;
  /** Highlight while a drag hovers over it. */
  isDropTarget?: boolean;
  /** Replaces the name with an inline editor when renaming. */
  renaming?: ReactNode;
  /** Optional drag-handle node (keyboard-accessible move). */
  dragHandle?: ReactNode;
}

/** Tier C — presentational folder tile. dnd / selection wiring lives in the connected row. */
export const FolderCard = forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    { node, selected, itemCount, isDropTarget, renaming, dragHandle, className, ...rest },
    ref,
  ) {
    const meta = [
      typeof itemCount === "number" ? `${itemCount} item${itemCount === 1 ? "" : "s"}` : null,
      node.modifiedAt ? formatRelativeTime(node.modifiedAt) : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <div
        ref={ref}
        className={cn(
          "group/folder relative flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-[border-color,box-shadow] outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          selected
            ? "border-primary ring-1 ring-primary"
            : "border-border hover:border-foreground/20 hover:shadow-md",
          isDropTarget && "border-primary bg-primary/5 ring-2 ring-primary",
          className,
        )}
        {...rest}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Folder className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          {renaming ?? (
            <p className="truncate text-sm font-medium text-foreground">{node.name}</p>
          )}
          {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        {dragHandle}
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover/folder:text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  },
);

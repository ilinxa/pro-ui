"use client";

import { Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Optional sibling export — drop in next to <RichCard /> for default
 * undo / redo affordances. Hosts can wire their own buttons via the
 * imperative ref handle.
 */
export function RichCardUndoToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  className?: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Undo / redo"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Cmd/Ctrl+Z)"
        aria-disabled={!canUndo}
        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Undo2 className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Cmd/Ctrl+Shift+Z)"
        aria-disabled={!canRedo}
        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Redo2 className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

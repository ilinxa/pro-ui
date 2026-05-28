"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ResolvedStoryViewer01Labels, Story, StoryItem } from "../types";

export interface CommentsPanelProps {
  story: Story;
  item: StoryItem;
  /** Whether the panel is currently open. Drives translateY animation. */
  open: boolean;
  /** Fires when the user dismisses the panel via the close button or backdrop. */
  onClose: () => void;
  labels: ResolvedStoryViewer01Labels;
  /**
   * Custom content (typically `<CommentThread01 />` with per-item comments
   * + onAddComment + onLoadMore wired). When absent, a default empty-state
   * is rendered.
   */
  children?: ReactNode;
}

/**
 * v0.3.0 — Instagram-style comments panel. Slides up from the bottom of
 * the viewer, holds ~62% of the viewer's height by default. The visual
 * content above shrinks via a CSS transform applied at the
 * story-viewer-01.tsx call site; this part owns only the panel chrome +
 * the close affordance + the children slot.
 *
 * Always mounted (DOM persistence keeps any consumer-side state — e.g.
 * draft composer text inside CommentThread01 — alive across open/close
 * cycles). Hidden via `translate-y-full` when `open` is false.
 */
export function CommentsPanel({
  story,
  open,
  onClose,
  labels,
  children,
}: CommentsPanelProps) {
  void story;
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-0 bottom-0 left-0 z-40 flex h-[62%] flex-col rounded-t-2xl bg-background text-foreground shadow-2xl transition-transform duration-300 ease-out",
        // Closed: slide down off-screen. Open: rest at bottom edge.
        open ? "translate-y-0 pointer-events-auto" : "translate-y-full",
      )}
      role="dialog"
      aria-modal={open ? "true" : undefined}
      aria-label={labels.commentsHeading}
      aria-hidden={open ? undefined : "true"}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">{labels.commentsHeading}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onClose}
          aria-label={labels.commentsCloseLabel}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children ?? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {labels.commentsDefaultEmptyState}
          </div>
        )}
      </div>
    </div>
  );
}

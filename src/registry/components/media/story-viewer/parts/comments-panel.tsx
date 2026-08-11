"use client";

import { type ReactNode } from "react";
import type { ResolvedStoryViewer01Labels, Story, StoryItem } from "../types";
import { BottomSheet } from "./bottom-sheet";

export interface CommentsPanelProps {
  story: Story;
  item: StoryItem;
  open: boolean;
  onClose: () => void;
  labels: ResolvedStoryViewer01Labels;
  /**
   * Custom content (typically `<CommentThread />` wired with per-item
   * comments + onAddComment + onLoadMore). When absent, a default
   * empty-state is rendered.
   */
  children?: ReactNode;
}

/**
 * v0.3.0 — Instagram-style comments panel. Thin wrapper over `BottomSheet`
 * with comments-specific labels and an empty-state fallback.
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
    <BottomSheet
      open={open}
      onClose={onClose}
      heading={labels.commentsHeading}
      closeLabel={labels.commentsCloseLabel}
    >
      {children ?? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {labels.commentsDefaultEmptyState}
        </div>
      )}
    </BottomSheet>
  );
}

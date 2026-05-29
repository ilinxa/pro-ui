"use client";

import { type ReactNode } from "react";
import type { ResolvedStoryViewer01Labels, Story, StoryItem } from "../types";
import { BottomSheet } from "./bottom-sheet";

export interface SharePanelProps {
  story: Story;
  item: StoryItem;
  open: boolean;
  onClose: () => void;
  labels: ResolvedStoryViewer01Labels;
  /**
   * Custom content (typically `<ShareMenu />` from engagement-bar-01 wired
   * with the recent-shareable-users list + onShareTo). When absent, a
   * default empty-state is rendered.
   */
  children?: ReactNode;
}

/**
 * v0.3.1 — Instagram-style share panel. Mirrors `CommentsPanel` for the
 * share affordance; opens when the share icon is tapped in the engagement
 * overlay. Host typically mounts `<ShareMenu />` (from `@ilinxa/engagement-bar-01`)
 * inside via `renderSharePanel`.
 */
export function SharePanel({
  story,
  open,
  onClose,
  labels,
  children,
}: SharePanelProps) {
  void story;
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      heading={labels.shareHeading}
      closeLabel={labels.shareCloseLabel}
    >
      {children ?? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {labels.shareDefaultEmptyState}
        </div>
      )}
    </BottomSheet>
  );
}

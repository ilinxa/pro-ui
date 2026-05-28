"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 cross-cat component import — absolute-with-suffix preserves through
// the shadcn 4.6.0 rewriter (Bug 3 only affects /types; /<slug>/<file> works).
import { EngagementBar01 } from "@/registry/components/data/engagement-bar-01/engagement-bar-01";
import type {
  ResolvedStoryViewer01Labels,
  Story,
  StoryEngagementAction,
  StoryItem,
} from "../types";

export interface EngagementOverlayProps {
  story: Story;
  item: StoryItem;
  /**
   * Resolved StoryEngagementAction[] (built via lib/engagement-actions.ts).
   * Structurally identical to engagement-bar-01's `EngagementAction[]` —
   * cast at the EngagementBar01 boundary (inline-copy structural compat).
   */
  actions: StoryEngagementAction[];
  labels: ResolvedStoryViewer01Labels;
  className?: string;
}

/**
 * Engagement overlay — TikTok/Reels-style vertical stack on the right edge
 * of the viewer. Per Q-V2 lock: variant="stacked" is the default; engagement-
 * bar v0.3.x introduced the stacked variant explicitly for portrait full-
 * screen media.
 *
 * Mounting gated by `viewerMode === "viewer"` AND `!disableEngagement` (the
 * caller — story-viewer-01.tsx — handles the gate; this part trusts the
 * caller's decision).
 */
function EngagementOverlayInner(props: EngagementOverlayProps) {
  return (
    <div
      className={cn(
        "absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3 text-white",
        props.className,
      )}
    >
      {/* Structural-equivalence cast: StoryEngagementAction is an inline-copy
          of EngagementAction (F-S1 Bug 3 fix). TypeScript can't unify the
          two distinct types even though they share structure; the cast at the
          single composition boundary keeps the rest of the file fully typed. */}
      <EngagementBar01
        variant="stacked"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actions={props.actions as any}
        labels={props.labels.engagementLabels}
      />
    </div>
  );
}

export const EngagementOverlay = memo(EngagementOverlayInner);
EngagementOverlay.displayName = "EngagementOverlay";

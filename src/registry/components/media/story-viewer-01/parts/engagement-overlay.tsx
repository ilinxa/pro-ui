"use client";

import { type Ref, memo } from "react";
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
  /**
   * v0.3.5 — whether the engagement bar is currently expanded. When false,
   * the bar is hidden; when true, the icons appear with a staggered bottom-
   * to-top animation. The toggle itself lives outside this part (v0.3.7:
   * inline in the DM bar row, rendered by story-viewer-01.tsx).
   */
  expanded?: boolean;
  className?: string;
  /**
   * v0.3.5 — caller-supplied ref for the column root. story-viewer-01 uses
   * this to detect outside-pointer events and collapse the column.
   */
  containerRef?: Ref<HTMLDivElement>;
}

/**
 * Engagement overlay — TikTok/Reels-style vertical stack on the right edge
 * of the viewer (above the DM bar). Per Q-V2 lock: variant="stacked" is the
 * default; engagement-bar v0.3.x introduced the stacked variant explicitly
 * for portrait full-screen media.
 *
 * v0.3.5 — collapsed-by-default UX. Icons hidden by default; expanding
 * triggers a staggered bottom-to-top reveal. Kebab moved out of this part
 * to the header.
 *
 * v0.3.7 — heart toggle moved out of this part to the DM bar row (rendered
 * by story-viewer-01.tsx). This part now ONLY renders the engagement bar
 * itself.
 *
 * Mounting gated by `viewerMode === "viewer"` AND `!disableEngagement` (the
 * caller — story-viewer-01.tsx — handles the gate; this part trusts the
 * caller's decision).
 */
function EngagementOverlayInner(props: EngagementOverlayProps) {
  const { expanded = false, containerRef } = props;
  return (
    <div
      ref={containerRef}
      className={cn(
        // v0.3.7: bottom-20 leaves room for the DM bar row (which sits at
        // bottom-0 with ~56px height including padding). Heart toggle lives
        // inline in the DM bar; this column only renders the icons.
        "absolute right-3 bottom-20 z-30 flex flex-col items-center gap-3 text-white",
        // Each direct child of the bar is an ActionButton; animate each.
        "[&>div>*]:transition-all [&>div>*]:duration-300 [&>div>*]:ease-out",
        // Collapsed: hidden + offset down.
        !expanded &&
          "pointer-events-none [&>div>*]:opacity-0 [&>div>*]:translate-y-4 [&>div>*]:pointer-events-none",
        // Expanded: visible + at rest.
        expanded && "[&>div>*]:opacity-100 [&>div>*]:translate-y-0",
        // Bottom-to-top stagger when expanding — last child first.
        "[&>div>*:nth-last-child(1)]:delay-0",
        "[&>div>*:nth-last-child(2)]:delay-75",
        "[&>div>*:nth-last-child(3)]:delay-150",
        "[&>div>*:nth-last-child(4)]:delay-200",
        props.className,
      )}
      aria-hidden={expanded ? undefined : "true"}
    >
      {/* Structural-equivalence cast: StoryEngagementAction is an inline-copy
          of EngagementAction (F-S1 Bug 3 fix). TypeScript can't unify the
          two distinct types even though they share structure; the cast at
          the single composition boundary keeps the rest of the file fully
          typed. */}
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

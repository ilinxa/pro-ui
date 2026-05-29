"use client";

import { type Ref, memo } from "react";
import { Heart } from "lucide-react";
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
   * only the toggle heart at the bottom is visible. When true, the
   * engagement icons appear above with a staggered bottom-to-top animation.
   */
  expanded?: boolean;
  /** Fires when the user taps the heart toggle. */
  onToggle?: () => void;
  className?: string;
  /**
   * v0.3.5 — caller-supplied ref for the column root. story-viewer-01
   * uses this to detect outside-pointer events and collapse the column.
   */
  containerRef?: Ref<HTMLDivElement>;
}

/**
 * Engagement overlay — TikTok/Reels-style vertical stack on the right edge
 * of the viewer. Per Q-V2 lock: variant="stacked" is the default; engagement-
 * bar v0.3.x introduced the stacked variant explicitly for portrait full-
 * screen media.
 *
 * v0.3.5 — collapsed-by-default UX. Only the heart toggle at the bottom is
 * visible until the user taps it; then the engagement bar appears above
 * with a staggered bottom-to-top animation. Tapping elsewhere collapses
 * the bar back. Kebab moved out of the engagement column to the header.
 *
 * Mounting gated by `viewerMode === "viewer"` AND `!disableEngagement` (the
 * caller — story-viewer-01.tsx — handles the gate; this part trusts the
 * caller's decision).
 */
function EngagementOverlayInner(props: EngagementOverlayProps) {
  const { expanded = false, onToggle, containerRef } = props;
  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3 text-white",
        props.className,
      )}
    >
      {/* Engagement bar — v0.3.5: each action transitions in with a
          staggered delay (bottom-first ⇒ comment first since the bar
          ordering is like/reaction/comment/share top-to-bottom).
          When collapsed, the actions fade out + slide down +
          pointer-events disabled. */}
      <div
        className={cn(
          "flex flex-col items-center gap-3 text-white",
          // Each direct child of the bar is an ActionButton; animate each.
          "[&>div>*]:transition-all [&>div>*]:duration-300 [&>div>*]:ease-out",
          // Collapsed: hidden + offset down.
          !expanded &&
            "[&>div>*]:opacity-0 [&>div>*]:translate-y-4 [&>div>*]:pointer-events-none",
          // Expanded: visible + at rest.
          expanded &&
            "[&>div>*]:opacity-100 [&>div>*]:translate-y-0",
          // Bottom-to-top stagger when expanding — last child first.
          "[&>div>*:nth-last-child(1)]:delay-0",
          "[&>div>*:nth-last-child(2)]:delay-75",
          "[&>div>*:nth-last-child(3)]:delay-150",
          "[&>div>*:nth-last-child(4)]:delay-200",
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

      {/* v0.3.5 — heart toggle button. Always visible; tap to reveal /
          collapse the engagement bar above. Sits at the bottom of the
          stack — visual anchor regardless of expansion state. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded ? "true" : "false"}
        aria-label={expanded ? "Hide reactions" : "Show reactions"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          "hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-white/40",
        )}
      >
        <Heart
          className={cn(
            "h-6 w-6 transition-transform duration-200",
            expanded && "scale-110 fill-current text-rose-400",
          )}
        />
      </button>
    </div>
  );
}

export const EngagementOverlay = memo(EngagementOverlayInner);
EngagementOverlay.displayName = "EngagementOverlay";

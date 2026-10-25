/**
 * Build the StoryEngagementAction[] for the engagement overlay's
 * <EngagementBar variant="stacked">. Honors the resolved permissions matrix
 * + reactionKinds + per-item engagement state.
 *
 * Reaction action is only added when both `canReact` resolves true AND the
 * host supplied `reactionKinds` (per Q-V4 lock — engagement-bar v0.3.x reaction
 * kinds are host-supplied, no library defaults).
 */

import type {
  Story,
  StoryEngagementAction,
  StoryEngagementReactionKind,
  StoryItem,
  StoryPermissionAction,
  StoryViewerPermissions,
} from "../types";
import type { StoryItemEngagementState } from "../hooks/use-story-engagement-state";
import {
  canPerformStoryActionInternal,
  resolveStoryPermissions,
} from "./permissions";

export interface BuildEngagementActionsOptions {
  story: Story;
  item: StoryItem;
  state: StoryItemEngagementState;
  /** Resolved matrix from resolveStoryPermissions. */
  matrix: Required<StoryViewerPermissions>;
  canPerformAction?: (
    action: StoryPermissionAction,
    story: Story,
    item: StoryItem,
  ) => boolean | undefined;
  reactionKinds?: StoryEngagementReactionKind[];
  /** Like toggle handler — fires onLikeStory through to the consumer. */
  onLikeToggle?: (nextLiked: boolean) => void;
  /** Reaction select handler — fires onReactStory. */
  onReactSelect?: (kind: string | null) => void;
  /** Comment click handler — typically focuses the reply composer. */
  onCommentClick?: () => void;
  /** Share click handler. */
  onShareClick?: () => void;
}

export function buildStoryEngagementActions(
  opts: BuildEngagementActionsOptions,
): StoryEngagementAction[] {
  const canDo = (action: StoryPermissionAction) =>
    canPerformStoryActionInternal(
      action,
      opts.story,
      opts.item,
      opts.matrix,
      opts.canPerformAction,
    );

  const actions: StoryEngagementAction[] = [];

  // Like (gated by `like`, which resolves to the same answer as `react` unless the host
  // gates it separately; owners don't like their own — the matrix handles it)
  if (canDo("like")) {
    actions.push({
      kind: "like",
      count: opts.state.likeCount,
      liked: opts.state.liked,
      onToggle: opts.onLikeToggle,
    });
  }

  // Reaction — only when canReact AND reactionKinds supplied
  if (canDo("react") && opts.reactionKinds && opts.reactionKinds.length > 0) {
    actions.push({
      kind: "reaction",
      kinds: opts.reactionKinds,
      // Seeded / live total. Withheld (`null`) and zero both render no number, so a host
      // that never seeds a count sees the same bar as before.
      totalCount:
        opts.state.reactionCount !== null && opts.state.reactionCount > 0
          ? opts.state.reactionCount
          : null,
      viewerReaction: opts.state.viewerReaction,
      onSelect: opts.onReactSelect,
      clearOnTap: true, // Q-V4 lock — inherited engagement-bar v0.3 default
    });
  }

  // Comment (always shown in viewer mode; opens reply composer)
  if (canDo("reply")) {
    actions.push({
      kind: "comment",
      count:
        opts.state.replyCount !== null && opts.state.replyCount > 0
          ? opts.state.replyCount
          : undefined,
      onClick: opts.onCommentClick,
    });
  }

  // Share
  if (canDo("share")) {
    actions.push({
      kind: "share",
      onClick: opts.onShareClick,
    });
  }

  // Bookmark removed in v0.3.0 — stories are not bookmarkable.
  //
  // Kebab moved to header right cluster in v0.3.5 (user feedback —
  // engagement-overlay kebab was visually inconsistent and not
  // functional). The header always renders the kebab when viewerMode is
  // set + kebab items exist.

  return actions;
}

/**
 * Convenience wrapper — resolves permissions matrix + builds the actions in
 * one call. Used by story-viewer.tsx when assembling the overlay.
 */
export function buildStoryEngagementActionsWithMatrix(
  opts: Omit<BuildEngagementActionsOptions, "matrix"> & {
    viewerMode?: "owner" | "viewer";
    permissions?: StoryViewerPermissions;
  },
): StoryEngagementAction[] {
  const matrix = resolveStoryPermissions(opts.viewerMode, opts.permissions);
  return buildStoryEngagementActions({ ...opts, matrix });
}

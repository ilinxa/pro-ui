/**
 * Build the StoryEngagementAction[] for the engagement overlay's
 * <EngagementBar01 variant="stacked">. Honors the resolved permissions matrix
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
  /** Kebab open handler — fires when the 5th custom-action is tapped. */
  onKebabOpen?: () => void;
  /** Icon node for the kebab custom action. */
  kebabIcon?: import("react").ReactNode;
  /** Aria label for the kebab custom action. */
  kebabLabel?: string;
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

  // Like (gated by canReact for viewer mode; owners don't like their own — matrix handles it)
  if (canDo("react")) {
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
      viewerReaction: opts.state.viewerReaction,
      onSelect: opts.onReactSelect,
      clearOnTap: true, // Q-V4 lock — inherited engagement-bar v0.3 default
    });
  }

  // Comment (always shown in viewer mode; opens reply composer)
  if (canDo("reply")) {
    actions.push({
      kind: "comment",
      count: opts.state.replyCount > 0 ? opts.state.replyCount : undefined,
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

  // Bookmark removed in v0.3.0 — stories are not bookmarkable (Instagram-
  // canonical: stories are ephemeral, only owners "save to highlights" via
  // the kebab; viewers don't bookmark).

  // Kebab — last item, rendered via kind="custom" (Q-V17 lock — kebab in
  // engagement overlay; HeaderKebabFallback handles disableEngagement).
  if (opts.onKebabOpen) {
    actions.push({
      kind: "custom",
      id: "kebab",
      label: opts.kebabLabel ?? "More",
      icon: opts.kebabIcon,
      onClick: opts.onKebabOpen,
    });
  }

  return actions;
}

/**
 * Convenience wrapper — resolves permissions matrix + builds the actions in
 * one call. Used by story-viewer-01.tsx when assembling the overlay.
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

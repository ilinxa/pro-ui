"use client";

import { memo } from "react";
import type {
  EngagementAction,
  EngagementCount,
  EngagementActionEvent,
  EngagementBarSize,
  EngagementBarVariant,
  EngagementState,
  ResolvedEngagementBarLabels,
} from "../types";
import type { Direction } from "../hooks/use-direction";
import { LikeAction } from "./like-action";
import { CommentAction } from "./comment-action";
import { ShareAction } from "./share-action";
import { BookmarkAction } from "./bookmark-action";
import { ViewCountAction } from "./view-count-action";
import { CustomAction } from "./custom-action";
import { ReactionAction } from "./reaction-action";

interface ActionButtonProps {
  action: EngagementAction;
  variant: EngagementBarVariant;
  /** The bar's shown state (props + overlays). */
  state: EngagementState;
  onToggleLike: (event?: EngagementActionEvent) => void;
  onToggleBookmark: (event?: EngagementActionEvent) => void;
  onSelectReaction: (kind: string | null) => void;
  format: (n: number) => string;
  labels: ResolvedEngagementBarLabels;
  dir: Direction;
  onReactionPickerOpenChange?: (open: boolean) => void;
  actionClassName?: string;
  hideZeroCounts?: boolean;
  size?: EngagementBarSize;
}

/**
 * Dispatches to the per-kind action component. Toggle / select logic lives in the bar's state
 * hook (one path for clicks and the imperative handle); React.memo on each per-kind part keeps
 * re-renders cheap.
 */
function ActionButtonInner({
  action,
  variant,
  state,
  onToggleLike,
  onToggleBookmark,
  onSelectReaction,
  format,
  labels,
  dir,
  onReactionPickerOpenChange,
  actionClassName,
  hideZeroCounts = false,
  size = "default",
}: ActionButtonProps) {
  // `hideZeroCounts`: a count of exactly 0 is withheld (null) so no digit and no name part render.
  const shown = (n: EngagementCount): EngagementCount => (hideZeroCounts && n === 0 ? null : n);
  switch (action.kind) {
    case "like":
      return (
        <LikeAction
          variant={variant}
          liked={state.liked}
          count={shown(state.likeCount)}
          disabled={action.disabled}
          onToggle={onToggleLike}
          onCountClick={action.onCountClick}
          countExpanded={action.countExpanded}
          countControls={action.countControls}
          format={format}
          labels={labels}
          actionClassName={actionClassName}
          size={size}
        />
      );
    case "comment":
      return (
        <CommentAction
          variant={variant}
          count={shown(state.commentCount)}
          disabled={action.disabled}
          onClick={action.onClick}
          expanded={action.expanded}
          controls={action.controls}
          format={format}
          labels={labels}
          actionClassName={actionClassName}
          size={size}
        />
      );
    case "share":
      return (
        <ShareAction
          variant={variant}
          count={shown(state.shareCount)}
          disabled={action.disabled}
          onClick={action.onClick}
          expanded={action.expanded}
          controls={action.controls}
          format={format}
          labels={labels}
          actionClassName={actionClassName}
          size={size}
        />
      );
    case "bookmark":
      return (
        <BookmarkAction
          variant={variant}
          bookmarked={state.bookmarked}
          disabled={action.disabled}
          onToggle={onToggleBookmark}
          labels={labels}
          actionClassName={actionClassName}
          size={size}
        />
      );
    case "view-count":
      return (
        <ViewCountAction
          variant={variant}
          count={shown(state.viewCount)}
          format={format}
          labels={labels}
          actionClassName={actionClassName}
        />
      );
    case "custom":
      return (
        <CustomAction
          variant={variant}
          id={action.id}
          label={action.label}
          icon={action.icon}
          count={shown(
            typeof action.count === "number" && Number.isFinite(action.count)
              ? action.count
              : null,
          )}
          active={action.active}
          disabled={action.disabled}
          onClick={action.onClick}
          expanded={action.expanded}
          controls={action.controls}
          format={format}
          actionClassName={actionClassName}
          size={size}
        />
      );
    case "reaction":
      return (
        <ReactionAction
          action={action}
          variant={variant}
          state={state}
          onSelect={onSelectReaction}
          format={format}
          labels={labels}
          dir={dir}
          onPickerOpenChange={onReactionPickerOpenChange}
          hideZeroCounts={hideZeroCounts}
          actionClassName={actionClassName}
          size={size}
        />
      );
  }
}

export const ActionButton = memo(ActionButtonInner);
ActionButton.displayName = "ActionButton";

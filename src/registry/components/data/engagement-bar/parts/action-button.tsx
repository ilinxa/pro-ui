"use client";

import { memo } from "react";
import type {
  EngagementAction,
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
  onToggleLike: () => void;
  onToggleBookmark: () => void;
  onSelectReaction: (kind: string | null) => void;
  format: (n: number) => string;
  labels: ResolvedEngagementBarLabels;
  dir: Direction;
  actionClassName?: string;
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
  actionClassName,
}: ActionButtonProps) {
  switch (action.kind) {
    case "like":
      return (
        <LikeAction
          variant={variant}
          liked={state.liked}
          count={state.likeCount}
          disabled={action.disabled}
          onToggle={onToggleLike}
          onCountClick={action.onCountClick}
          format={format}
          labels={labels}
          actionClassName={actionClassName}
        />
      );
    case "comment":
      return (
        <CommentAction
          variant={variant}
          count={state.commentCount}
          disabled={action.disabled}
          onClick={action.onClick}
          format={format}
          labels={labels}
          actionClassName={actionClassName}
        />
      );
    case "share":
      return (
        <ShareAction
          variant={variant}
          count={state.shareCount}
          disabled={action.disabled}
          onClick={action.onClick}
          format={format}
          labels={labels}
          actionClassName={actionClassName}
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
        />
      );
    case "view-count":
      return (
        <ViewCountAction
          variant={variant}
          count={state.viewCount}
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
          count={
            typeof action.count === "number" && Number.isFinite(action.count)
              ? action.count
              : null
          }
          active={action.active}
          disabled={action.disabled}
          onClick={action.onClick}
          format={format}
          actionClassName={actionClassName}
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
          actionClassName={actionClassName}
        />
      );
  }
}

export const ActionButton = memo(ActionButtonInner);
ActionButton.displayName = "ActionButton";

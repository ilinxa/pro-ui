"use client";

import { memo } from "react";
import type {
  EngagementAction,
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementLocalAction,
  EngagementState,
} from "../types";
import { LikeAction } from "./like-action";
import { CommentAction } from "./comment-action";
import { ShareAction } from "./share-action";
import { BookmarkAction } from "./bookmark-action";
import { ViewCountAction } from "./view-count-action";
import { CustomAction } from "./custom-action";

interface ControlledFlags {
  liked: boolean;
  bookmarked: boolean;
}

interface ActionButtonProps {
  action: EngagementAction;
  variant: EngagementBar01Variant;
  state: EngagementState;
  controlled: ControlledFlags;
  dispatch: React.Dispatch<EngagementLocalAction>;
  format: (n: number) => string;
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  actionClassName?: string;
}

/**
 * Dispatches to the per-kind action component. Click handlers live INSIDE
 * each per-kind component (not memoized upstream — that would be a hooks-rules
 * violation inside `.map()`). React.memo on each per-kind keeps re-renders cheap.
 */
function ActionButtonInner({
  action,
  variant,
  state,
  controlled,
  dispatch,
  format,
  labels,
  actionClassName,
}: ActionButtonProps) {
  switch (action.kind) {
    case "like":
      return (
        <LikeAction
          variant={variant}
          liked={state.liked}
          count={state.likeCount}
          controlled={controlled.liked}
          onToggle={action.onToggle}
          onCountClick={action.onCountClick}
          format={format}
          labels={labels}
          dispatch={dispatch}
          actionClassName={actionClassName}
        />
      );
    case "comment":
      return (
        <CommentAction
          variant={variant}
          count={state.commentCount}
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
          count={state.shareCount ?? undefined}
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
          controlled={controlled.bookmarked}
          onToggle={action.onToggle}
          labels={labels}
          dispatch={dispatch}
          actionClassName={actionClassName}
        />
      );
    case "view-count":
      return (
        <ViewCountAction
          variant={variant}
          count={state.viewCount ?? action.count}
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
          count={action.count}
          active={action.active}
          onClick={action.onClick}
          format={format}
          actionClassName={actionClassName}
        />
      );
  }
}

export const ActionButton = memo(ActionButtonInner);
ActionButton.displayName = "ActionButton";

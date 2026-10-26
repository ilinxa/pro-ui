export { CommentThread } from "./comment-thread";

export {
  CommentComposer,
  type CommentComposerProps,
  type CommentComposerHandle,
} from "./parts/comment-composer";

export {
  commentReducer,
  useCommentState,
  type UseCommentStateOptions,
  type UseCommentStateResult,
} from "./hooks/use-comment-state";

export {
  useAutosizeTextarea,
  type UseAutosizeTextareaOptions,
} from "./hooks/use-autosize-textarea";

export {
  CommentModerationContext,
  useCommentModerationOptional,
} from "./hooks/use-moderation-extension";

export {
  createRelativeTimeFormatter,
  defaultRelativeTime,
  toDate,
} from "./lib/format-time";

export type {
  Comment,
  CommentThreadProps,
  CommentThreadHandle,
  CommentThreadVariant,
  CommentThreadLabels,
  ResolvedCommentThreadLabels,
  CommentThreadCurrentUser,
  CommentNodeHelpers,
  CommentActionHelpers,
  CommentEngagementHelpers,
  CommentComposerState,
  CommentComposerHelpers,
  CommentMenuItem,
  CommentDelta,
  CommentLocalAction,
  CommentsChange,
  CommentErrorContext,
  CommentPage,
  CommentAddOptions,
  CommentState,
  CommentTombstoneState,
  CommentPermissions,
  ResolvedCommentPermissions,
  CommentReactions,
  CommentModerationExtension,
  CommentEditComposerProps,
  CommentTombstoneProps,
  CommentPinnedMarkerProps,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_COMMENT_THREAD_LABELS, defaultCommentThreadLabels } from "./types";

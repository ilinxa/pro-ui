export { CommentThread } from "./comment-thread";
export { CommentThreadRoot } from "./parts/comment-thread-root";
export { CommentThreadList } from "./parts/comment-thread-list";
export { CommentThreadLoadMore } from "./parts/comment-thread-load-more";
export { CommentThreadComposer } from "./parts/comment-thread-composer";
export { CommentThreadScrollArea } from "./parts/comment-thread-scroll-area";
export { useCommentThread } from "./hooks/use-comment-thread";

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
  CommentThreadSize,
  CommentThreadRootProps,
  CommentThreadListProps,
  CommentThreadLoadMoreProps,
  CommentThreadComposerProps,
  CommentThreadScrollAreaProps,
  CommentThreadState,
  CommentDeleteConfirm,
  CommentDeleteConfirmExtension,
  CommentDeleteDialogProps,
  CommentDeleteRequest,
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

export { CommentThread01 } from "./comment-thread-01";

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

export { defaultRelativeTime, toDate } from "./lib/format-time";

export type {
  Comment,
  CommentThread01Props,
  CommentThread01Handle,
  CommentThread01Variant,
  CommentThreadLabels,
  CommentThreadCurrentUser,
  CommentNodeHelpers,
  CommentComposerState,
  CommentComposerHelpers,
  CommentMenuItem,
  CommentDelta,
  CommentLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_COMMENT_THREAD_LABELS } from "./types";

export { meta } from "./meta";

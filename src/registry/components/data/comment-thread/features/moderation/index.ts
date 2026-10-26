// comment-thread moderation feature — inline edit, tombstones, pinned marker.
//
// Injected into the base with `moderation={commentModeration}` (CommentThreadProps — see
// `../../hooks/use-moderation-extension.ts`). Ships as its own registry item,
// `@ilinxa/comment-thread-moderation`, which depends on `@ilinxa/comment-thread`. The base never
// imports this folder.

import type { CommentModerationExtension } from "../../types";
import { CommentEditComposer } from "./parts/edit-composer";
import { CommentPinnedMarker } from "./parts/pinned-marker";
import { CommentTombstone } from "./parts/tombstone";

/** Pass straight through: `<CommentThread moderation={commentModeration} />`. */
export const commentModeration: CommentModerationExtension = {
  EditComposer: CommentEditComposer,
  Tombstone: CommentTombstone,
  PinnedMarker: CommentPinnedMarker,
};

export { CommentEditComposer } from "./parts/edit-composer";
export { CommentTombstone } from "./parts/tombstone";
export { CommentPinnedMarker } from "./parts/pinned-marker";

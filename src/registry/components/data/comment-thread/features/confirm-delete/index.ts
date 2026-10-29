// comment-thread confirm-delete feature — a dialog that asks before a comment is deleted.
//
// Injected into the base with `confirmDelete={commentDeleteConfirm}` (CommentThreadProps). Ships as
// its own registry item, `@ilinxa/comment-thread-confirm-delete`, which depends on
// `@ilinxa/comment-thread`. The base never imports this folder.

import type { CommentDeleteConfirmExtension } from "../../types";
import { CommentDeleteConfirmDialog } from "./parts/delete-confirm-dialog";

/** Pass straight through: `<CommentThread confirmDelete={commentDeleteConfirm} />`. */
export const commentDeleteConfirm: CommentDeleteConfirmExtension = {
  Dialog: CommentDeleteConfirmDialog,
};

export { CommentDeleteConfirmDialog } from "./parts/delete-confirm-dialog";

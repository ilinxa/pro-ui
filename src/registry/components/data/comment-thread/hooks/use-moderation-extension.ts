"use client";

import { createContext, useContext } from "react";
import type { CommentModerationExtension } from "../types";

/**
 * Moderation injection seam (feature-slicing, injection surface). The base never imports
 * `features/moderation/**`: a consumer wires inline edit, tombstones and the pinned marker in by
 * passing `moderation={commentModeration}` (registry item `@ilinxa/comment-thread-moderation`, imported from
 * `@/components/comment-thread/features/moderation`), or their own
 * implementation of {@link CommentModerationExtension}). The thread publishes that value here so
 * every row reads it without prop drilling.
 */
export const CommentModerationContext =
  createContext<CommentModerationExtension | null>(null);

/** Null when no `moderation` extension is wired. */
export function useCommentModerationOptional(): CommentModerationExtension | null {
  return useContext(CommentModerationContext);
}

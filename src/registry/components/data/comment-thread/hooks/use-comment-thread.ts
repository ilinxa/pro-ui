"use client";

import type { CommentThreadState } from "../types";
import { useThreadRoot } from "../parts/thread-root-context";

/** The thread's state for custom parts. Must be used inside a `CommentThreadRoot`. */
export function useCommentThread(): CommentThreadState {
  return useThreadRoot("useCommentThread").state;
}

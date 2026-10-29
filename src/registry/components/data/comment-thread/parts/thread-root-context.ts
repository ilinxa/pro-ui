"use client";

import { createContext, useContext, type ComponentType, type ReactNode } from "react";
import type {
  CommentComposerHelpers,
  CommentComposerState,
  CommentThreadSize,
  CommentThreadState,
} from "../types";
import type { CommentComposerHandle, CommentComposerProps } from "./comment-composer";

/** Internal: what the compound parts read from `CommentThreadRoot` (the public slice is `state`). */
export interface ThreadRootContextValue {
  /** The public slice `useCommentThread()` returns. */
  state: CommentThreadState;
  size: CommentThreadSize;
  composerClassName?: string;
  composerMinRows: number;
  composerMaxRows: number;
  submitOnEnter: boolean;
  renderComposer?: (state: CommentComposerState, helpers: CommentComposerHelpers) => ReactNode;
  composerEmptyState?: ReactNode;
  emptyState?: ReactNode;
  /** No visible comment and no `subscribe`: the list shows its empty state. */
  showEmpty: boolean;
  submitTopLevel: (content: string) => Promise<void>;
  /** The list `<ul>`, for the load-more focus hand-off. */
  registerList: (el: HTMLUListElement | null) => void;
  /** The load-more button; focus moving anywhere else cancels a waiting hand-off. */
  registerLoadMoreButton: (el: HTMLButtonElement | null) => void;
  /** The bottom composer's handle, for `handle.focusComposer()`. */
  registerComposer: (handle: CommentComposerHandle | null, previous?: CommentComposerHandle | null) => void;
  /**
   * The composer component, handed over by `CommentThreadComposer` (which imports it statically)
   * for the rows' inline reply boxes; without that part the rows load it lazily (CT-7).
   */
  registerReplyComposer: (component: ComponentType<CommentComposerProps> | null) => void;
  /** A click on "Load older comments": focus the first new row once the page is in. */
  beginLoadMoreFocus: () => void;
}

export const ThreadRootContext = createContext<ThreadRootContextValue | null>(null);

/** The root context, or `null` outside a `CommentThreadRoot`. */
export function useThreadRootOptional(): ThreadRootContextValue | null {
  return useContext(ThreadRootContext);
}

export function useThreadRoot(part: string): ThreadRootContextValue {
  const value = useContext(ThreadRootContext);
  if (!value) throw new Error(`${part} must be used inside CommentThreadRoot`);
  return value;
}

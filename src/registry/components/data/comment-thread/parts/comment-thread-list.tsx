"use client";

import { cn } from "@/lib/utils";
import type { CommentThreadListProps } from "../types";
import { CommentNode } from "./comment-node";
import { CommentEmptyState } from "./comment-empty-state";
import { useThreadRoot } from "./thread-root-context";

/** The top-level comments, or the empty state. */
export function CommentThreadList({ className }: CommentThreadListProps) {
  const { showEmpty, emptyState, registerList, state } = useThreadRoot("CommentThreadList");
  if (showEmpty) {
    return <>{emptyState ?? <CommentEmptyState message={state.labels.emptyState} />}</>;
  }
  return (
    <ul ref={registerList} className={cn("flex flex-col gap-3", className)}>
      {state.comments.map((c) => (
        <li key={c.id}>
          <CommentNode comment={c} depth={0} />
        </li>
      ))}
    </ul>
  );
}

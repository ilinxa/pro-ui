"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { CommentTombstoneProps } from "../../../types";

/** Stands in for a deleted, hidden or removed comment; its replies render below it. */
function CommentTombstoneInner({ state, labels, className }: CommentTombstoneProps) {
  return (
    <p
      data-comment-state={state}
      className={cn(
        "rounded-xl bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground",
        className,
      )}
    >
      {labels.tombstone(state)}
    </p>
  );
}

export const CommentTombstone = memo(CommentTombstoneInner);
CommentTombstone.displayName = "CommentTombstone";

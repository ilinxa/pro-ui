"use client";

import { memo } from "react";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentPinnedMarkerProps } from "../../../types";

/** The "Pinned" marker shown beside a pinned comment's author name. */
function CommentPinnedMarkerInner({ labels, className }: CommentPinnedMarkerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <Pin className="h-3 w-3" aria-hidden="true" />
      {labels.pinned}
    </span>
  );
}

export const CommentPinnedMarker = memo(CommentPinnedMarkerInner);
CommentPinnedMarker.displayName = "CommentPinnedMarker";

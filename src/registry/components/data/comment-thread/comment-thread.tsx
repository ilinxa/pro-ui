"use client";

import { memo } from "react";
import type { CommentThreadHandle, CommentThreadProps } from "./types";
import { CommentThreadRoot } from "./parts/comment-thread-root";
import { CommentThreadList } from "./parts/comment-thread-list";
import { CommentThreadLoadMore } from "./parts/comment-thread-load-more";
import { CommentThreadComposer } from "./parts/comment-thread-composer";

interface CommentThreadAssemblyProps extends CommentThreadProps {
  ref?: React.Ref<CommentThreadHandle>;
}

/** The full thread: `CommentThreadRoot` + list + "load older" + composer. Hand-assemble the parts for other layouts. */
const CommentThread = memo(function CommentThread({ ref, ...props }: CommentThreadAssemblyProps) {
  return (
    <CommentThreadRoot {...props} ref={ref}>
      <CommentThreadList />
      <CommentThreadLoadMore />
      <CommentThreadComposer />
    </CommentThreadRoot>
  );
});
CommentThread.displayName = "CommentThread";

export { CommentThread };

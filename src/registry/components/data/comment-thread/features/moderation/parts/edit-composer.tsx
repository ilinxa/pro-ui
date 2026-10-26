"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import {
  CommentComposer,
  type CommentComposerHandle,
} from "../../../parts/comment-composer";
import type { CommentEditComposerProps } from "../../../types";

/**
 * Inline editor that replaces a comment's body. Reuses the thread's composer: the text starts as
 * the comment's content, Save posts it, Cancel and Escape leave it, and a rejected save keeps the
 * text and shows `labels.editFailed` in a `role="alert"` line (the composer owns that failure UI).
 */
function CommentEditComposerInner({
  comment,
  labels,
  onSave,
  onCancel,
  submitOnEnter,
  minRows,
  maxRows,
  className,
}: CommentEditComposerProps) {
  const composerLabels = useMemo(
    () => ({
      composerPlaceholder: labels.edit,
      composerSend: labels.save,
      composerCancel: labels.composerCancel,
      postFailed: labels.editFailed,
    }),
    [labels.edit, labels.save, labels.composerCancel, labels.editFailed],
  );

  // The Edit item lives in a menu that hands focus back to its trigger a beat after it closes,
  // which is after the editor mounts. Keep the caret in the editor: focus it, and take focus
  // back once if it lands outside the editor right after.
  const hostRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<CommentComposerHandle>(null);
  useEffect(() => {
    const focusEditor = () => composerRef.current?.focus();
    const first = setTimeout(focusEditor, 0);
    const reclaim = (event: FocusEvent) => {
      const host = hostRef.current;
      if (host && event.target instanceof Node && !host.contains(event.target)) focusEditor();
    };
    document.addEventListener("focusin", reclaim);
    const stop = setTimeout(() => document.removeEventListener("focusin", reclaim), 300);
    return () => {
      clearTimeout(first);
      clearTimeout(stop);
      document.removeEventListener("focusin", reclaim);
    };
  }, []);

  return (
    <div ref={hostRef} className={className}>
      <CommentComposer
        ref={composerRef}
        initialValue={comment.content}
        onSubmit={onSave}
        onCancel={onCancel}
        submitOnEnter={submitOnEnter}
        minRows={minRows}
        maxRows={maxRows}
        labels={composerLabels}
        ariaLabel={labels.edit}
        autoFocus
      />
    </div>
  );
}

export const CommentEditComposer = memo(CommentEditComposerInner);
CommentEditComposer.displayName = "CommentEditComposer";

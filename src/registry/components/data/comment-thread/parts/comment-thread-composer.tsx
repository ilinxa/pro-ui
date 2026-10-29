"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CommentComposerHelpers, CommentThreadComposerProps } from "../types";
import { CommentComposer, type CommentComposerHandle } from "./comment-composer";
import { useThreadRoot } from "./thread-root-context";

/** The bottom composer, or the closed notice, the `renderComposer` slot, or `composerEmptyState`. */
export function CommentThreadComposer({ className }: CommentThreadComposerProps) {
  const {
    state,
    size,
    submitTopLevel,
    renderComposer,
    registerComposer,
    registerReplyComposer,
    submitOnEnter,
    composerMinRows,
    composerMaxRows,
    composerClassName,
    composerEmptyState,
  } = useThreadRoot("CommentThreadComposer");
  const { closed, currentUser, labels } = state;

  // Register this part's own handle; on unmount remove only that one (a second part may be mounted).
  const ownHandle = useRef<CommentComposerHandle | null>(null);
  const setComposerRef = useCallback(
    (handle: CommentComposerHandle | null) => {
      const previous = ownHandle.current;
      ownHandle.current = handle;
      registerComposer(handle, previous);
    },
    [registerComposer],
  );

  // The rows' reply boxes use this (static) composer while the part is mounted (CT-7).
  useLayoutEffect(() => {
    registerReplyComposer(CommentComposer);
    return () => registerReplyComposer(null);
  }, [registerReplyComposer]);

  /*
   * State backing the `renderComposer` slot. The default composer owns its value
   * internally, so this state exists only for the slot path and costs the default
   * path nothing. `submit` never rejects: a failed post sets `hasError` and keeps
   * the value (the failure was already reported through `onError`).
   *
   * No ref is involved on purpose: `renderComposer(state, helpers)` runs DURING
   * render, so anything it receives is on a render-reachable path, and reading
   * `ref.current` there is what the React Compiler lint rejects. `submit`
   * therefore closes over the rendered value and accepts an explicit override
   * for the same-tick case.
   */
  const [slotValue, setSlotValueState] = useState("");
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [slotError, setSlotError] = useState(false);

  const setSlotValue = useCallback((next: string) => {
    setSlotValueState(next);
    setSlotError(false);
  }, []);
  const cancelSlot = useCallback(() => {
    setSlotValueState("");
    setSlotError(false);
  }, []);
  const submitSlot = useCallback(
    async (explicit?: string) => {
      const content = (explicit ?? slotValue).trim();
      if (!content) return;
      setSlotSubmitting(true);
      try {
        await submitTopLevel(content);
        setSlotValueState("");
        setSlotError(false);
      } catch {
        setSlotError(true);
      } finally {
        setSlotSubmitting(false);
      }
    },
    [slotValue, submitTopLevel],
  );
  const slotHelpers = useMemo<CommentComposerHelpers>(
    () => ({ setValue: setSlotValue, submit: submitSlot, cancel: cancelSlot }),
    [setSlotValue, submitSlot, cancelSlot],
  );

  const content = closed ? (
    <p className="text-center text-sm text-muted-foreground">{labels.closed}</p>
  ) : currentUser ? (
    renderComposer ? (
      renderComposer(
        { value: slotValue, isReply: false, isSubmitting: slotSubmitting, hasError: slotError },
        slotHelpers,
      )
    ) : (
      <CommentComposer
        ref={setComposerRef}
        currentUser={currentUser}
        placeholder={labels.composerPlaceholder}
        onSubmit={submitTopLevel}
        submitOnEnter={submitOnEnter}
        minRows={composerMinRows}
        maxRows={composerMaxRows}
        className={composerClassName}
        labels={labels}
        size={size}
      />
    )
  ) : (
    composerEmptyState
  );
  return className ? <div className={className}>{content}</div> : <>{content}</>;
}

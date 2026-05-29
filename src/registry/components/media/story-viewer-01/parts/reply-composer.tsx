"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
// F-S1 cross-cat component import — absolute-with-suffix preserves through
// the shadcn 4.6.0 rewriter (Bug 3 only affects /types).
import {
  CommentComposer,
  type CommentComposerHandle,
} from "@/registry/components/data/comment-thread-01/parts/comment-composer";
import type {
  ResolvedStoryViewer01Labels,
  Story,
  StoryCurrentUser,
  StoryItem,
} from "../types";

export interface ReplyComposerProps {
  story: Story;
  item: StoryItem;
  /** Viewer identity — required for composer mount. Absent → composer hidden. */
  currentUser?: StoryCurrentUser;
  /** Submit handler — story-viewer-01 forwards via onAddReply prop. */
  onAddReply?: (storyId: string, itemId: string, content: string) => Promise<void> | void;
  /** Pause the story while user types; resume on submit/cancel. */
  onSetPaused: (paused: boolean) => void;
  labels: ResolvedStoryViewer01Labels;
  className?: string;
  /** Optional handle ref so the parent can focus / pre-fill the composer (triggerReply). */
  composerRef?: React.Ref<CommentComposerHandle>;
  /**
   * v0.3.2 — fires when the composer becomes active (focused or has
   * content) vs collapsed (blurred + empty). Parent (story-viewer-01.tsx)
   * uses this to hide the right-edge engagement overlay while active so
   * the composer's expanded chrome (Cancel + Send) doesn't overlap the
   * engagement icons.
   */
  onActiveChange?: (active: boolean) => void;
}

/**
 * Reply composer mounted at the bottom of the viewer per Q-V1 lock (always-
 * visible Instagram-default bottom bar). Auto-pauses the story timer on
 * first character; resumes on submit / cancel.
 *
 * Mounting gated by `viewerMode === "viewer"` AND `!disableReplyComposer` AND
 * `currentUser` present — caller handles those gates. This part trusts the
 * caller's decision.
 *
 * When `currentUser` is absent, the part returns null — story-viewer-01.tsx
 * mounts `composerEmptyState` slot instead (sign-in CTA for unauth viewers).
 */
function ReplyComposerInner(props: ReplyComposerProps) {
  // Track whether user has typed anything since last submit; auto-pause
  // fires only on the FIRST keystroke (cheap idempotent setPaused call).
  const pausedRef = useRef(false);
  // v0.3.2 — focus + content tracking still fires `onActiveChange` for
  // host-side polish (e.g., a future heart-toggle that only reveals the
  // engagement column when composer is active). v0.3.3 stopped USING the
  // signal internally — gradient is full-width always; engagement stays
  // always visible; the Cancel button (which caused the collision) was
  // removed. The signal is kept for forward compat.
  const [hasFocus, setHasFocus] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const active = hasFocus || hasContent;
  const { onActiveChange } = props;
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  const handleChange = useCallback(
    (value: string) => {
      setHasContent(value.length > 0);
      if (value.length > 0 && !pausedRef.current) {
        pausedRef.current = true;
        props.onSetPaused(true);
      } else if (value.length === 0 && pausedRef.current) {
        // User cleared the composer manually — resume the story.
        pausedRef.current = false;
        props.onSetPaused(false);
      }
    },
    [props.onSetPaused],
  );

  const handleSubmit = useCallback(
    async (content: string) => {
      try {
        await props.onAddReply?.(props.story.id, props.item.id, content);
      } finally {
        pausedRef.current = false;
        setHasContent(false);
        props.onSetPaused(false);
      }
    },
    [props.onAddReply, props.story.id, props.item.id, props.onSetPaused],
  );

  if (!props.currentUser) return null;

  // CommentComposer accepts a stricter currentUser shape (CommentThreadCurrentUser).
  // StoryCurrentUser is structurally identical — cast at the boundary.
  return (
    <div
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={() => setHasFocus(false)}
      className={cn(
        // v0.3.3: full-width gradient strip at the bottom (right-0 always).
        // z-31 keeps the input above the engagement overlay (z-30) on the
        // OS focus stack so taps reliably reach the textarea.
        // v0.3.6: tightened vertical padding (`pt-3 pb-3` was `pt-8 pb-4`).
        // v0.3.7: right padding bumped to `pr-16` so the input doesn't
        // extend under the heart toggle that now sits inline in the DM bar
        // row (rendered by story-viewer-01.tsx at right-3 bottom-3).
        "absolute right-0 bottom-0 left-0 z-31 pl-4 pr-16 pt-3 pb-3 pointer-events-auto",
        "bg-linear-to-t from-black/60 via-black/40 to-transparent",
        props.className,
      )}
    >
      <CommentComposer
        ref={props.composerRef}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentUser={props.currentUser as any}
        placeholder={props.labels.replyComposerPlaceholder(props.story)}
        onChange={handleChange}
        onSubmit={handleSubmit}
        // v0.3.3: Cancel button removed per UX feedback — Instagram-canonical
        // story DM has no Cancel; engagement column stays visible. handleCancel
        // is still wired internally for future use (e.g. Escape key handler
        // on the textarea), but no Cancel button is rendered.
        // v0.3.4: removed `pr-12` — the engagement column sits at `bottom-24`
        // while the input is at `bottom-0`, so they don't overlap vertically
        // and the input can extend full width.
        // v0.3.6: override shadcn Textarea's baked-in `min-h-16` (64px) via
        // arbitrary-selector className passthrough — bring the textarea down
        // to a single-row height that matches the 8x8 avatar (`min-h-9`)
        // with tighter vertical padding. The textarea still auto-grows up
        // to `maxRows={3}` while typing.
        className="[&_textarea]:min-h-9 [&_textarea]:py-1.5 [&_textarea]:text-sm"
        submitOnEnter
        minRows={1}
        maxRows={3}
        ariaLabel={`Reply to ${props.story.username}`}
        labels={
          props.labels.commentLabels
            ? {
                composerPlaceholder: props.labels.commentLabels.composerPlaceholder,
                composerSend: props.labels.commentLabels.composerSend ?? props.labels.replyComposerSend,
                composerCancel: props.labels.commentLabels.composerCancel ?? props.labels.replyComposerCancel,
              }
            : {
                composerSend: props.labels.replyComposerSend,
                composerCancel: props.labels.replyComposerCancel,
              }
        }
      />
    </div>
  );
}

export const ReplyComposer = memo(ReplyComposerInner);
ReplyComposer.displayName = "ReplyComposer";

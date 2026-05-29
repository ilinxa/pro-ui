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
        // Engagement overlay sits at `right-3 bottom-24` ABOVE this gradient
        // — the column overlays visually on top of the dim. Internal padding
        // (`pr-20`) on the inner row keeps the textarea + Send button to
        // the left of the engagement column so they don't visually clash.
        // z-[31] keeps the input itself above engagement overlay (z-30) on
        // the OS focus stack so taps reliably reach the textarea.
        "absolute right-0 bottom-0 left-0 z-31 px-4 pt-8 pb-4 pointer-events-auto",
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
        submitOnEnter
        className="pr-12"
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

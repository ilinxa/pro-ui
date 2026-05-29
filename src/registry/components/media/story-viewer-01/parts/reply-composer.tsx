"use client";

import { memo, useCallback, useRef } from "react";
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
  // Track whether user has typed anything since last submit/cancel; auto-pause
  // fires only on the FIRST keystroke (cheap idempotent setPaused call too).
  const pausedRef = useRef(false);

  const handleChange = useCallback(
    (value: string) => {
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
        props.onSetPaused(false);
      }
    },
    [props.onAddReply, props.story.id, props.item.id, props.onSetPaused],
  );

  const handleCancel = useCallback(() => {
    pausedRef.current = false;
    props.onSetPaused(false);
  }, [props.onSetPaused]);

  if (!props.currentUser) return null;

  // CommentComposer accepts a stricter currentUser shape (CommentThreadCurrentUser).
  // StoryCurrentUser is structurally identical — cast at the boundary.
  return (
    <div
      className={cn(
        // v0.3.1: explicit pointer-events-auto + higher z (z-31) so the DM
        // input always wins focus over the engagement overlay (z-30) on the
        // right cluster + the TapZones (z-10) underneath. Width is bounded
        // to leave space for the right-side engagement overlay.
        "absolute right-16 bottom-0 left-0 z-[31] px-4 pt-8 pb-4 pointer-events-auto",
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
        onCancel={handleCancel}
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

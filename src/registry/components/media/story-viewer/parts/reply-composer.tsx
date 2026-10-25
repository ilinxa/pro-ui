"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
// F-S1 cross-cat component import — absolute-with-suffix preserves through
// the shadcn 4.6.0 rewriter (Bug 3 only affects /types).
import {
  CommentComposer,
  type CommentComposerHandle,
} from "@/registry/components/data/comment-thread/parts/comment-composer";
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
  /** Submit handler — story-viewer forwards via onAddReply prop. */
  onAddReply?: (storyId: string, itemId: string, content: string) => Promise<void> | void;
  /**
   * Called with `true` while the composer is focused or holds a draft, `false`
   * otherwise (and on unmount). The viewer maps it to the `reply-focus` pause reason.
   */
  onSetPaused: (paused: boolean) => void;
  labels: ResolvedStoryViewer01Labels;
  className?: string;
  /** Optional handle ref so the parent can focus / pre-fill the composer (triggerReply). */
  composerRef?: React.Ref<CommentComposerHandle>;
  /**
   * Pre-fill request (`triggerReply(content)`). Applied once per distinct
   * `nonce`; the text lands in the composer exactly as if typed (so the story
   * auto-pauses, same as typing).
   */
  prefill?: { nonce: number; text: string } | null;
  /**
   * @deprecated v0.3.3 — Cancel button removed and engagement column
   *   redesigned as a heart-toggle reveal in v0.3.5/v0.3.7. This callback
   *   is kept as a forward-compat hook for future host-side polish (e.g.,
   *   conditional engagement reveal tied to composer focus). Currently
   *   fired but not consumed by `story-viewer.tsx`.
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
 * When `currentUser` is absent, the part returns null — story-viewer.tsx
 * mounts `composerEmptyState` slot instead (sign-in CTA for unauth viewers).
 */
function ReplyComposerInner(props: ReplyComposerProps) {
  // Destructure ALL props to locals up front. `composerRef` is a ref-typed
  // prop; reading it as `props.composerRef` inside the JSX makes the React
  // Compiler's aliasing analysis treat the whole `props` object as a ref
  // container and flag every later `props.*` read as "ref access during
  // render" (known false-positive class — see blackboard lesson:
  // destructure to locals). Locals keep the analysis precise.
  const {
    story,
    item,
    currentUser,
    onAddReply,
    onSetPaused,
    labels,
    className,
    composerRef,
    onActiveChange,
    prefill,
  } = props;
  // v0.3.2 — focus + content tracking still fires `onActiveChange` for
  // host-side polish (e.g., a future heart-toggle that only reveals the
  // engagement column when composer is active). v0.3.3 stopped USING the
  // signal internally — gradient is full-width always; engagement stays
  // always visible; the Cancel button (which caused the collision) was
  // removed. The signal is kept for forward compat.
  const [hasFocus, setHasFocus] = useState(false);
  // Controlled text so triggerReply(content) can pre-fill.
  const [text, setText] = useState("");
  // Derived, so a failed send (text kept by the composer) still reads as content.
  const hasContent = text.length > 0;
  const active = hasFocus || hasContent;
  const [appliedNonce, setAppliedNonce] = useState(prefill?.nonce ?? 0);
  if (prefill && prefill.nonce !== appliedNonce) {
    setAppliedNonce(prefill.nonce);
    setText(prefill.text);
  }
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // The story is paused (`reply-focus`) while the composer is focused or holds a
  // draft (a pre-fill counts as a draft), and resumes when both clear. The cleanup
  // releases the reason when the composer unmounts (it is keyed per item).
  useEffect(() => {
    onSetPaused(active);
  }, [active, onSetPaused]);
  useEffect(() => () => onSetPaused(false), [onSetPaused]);

  const handleChange = useCallback((value: string) => setText(value), []);

  const handleSubmit = useCallback(
    async (content: string) => {
      await onAddReply?.(story.id, item.id, content);
    },
    [onAddReply, story.id, item.id],
  );

  if (!currentUser) return null;

  // StoryCurrentUser is structurally identical to CommentThreadCurrentUser, so it is assignable as is.
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
        // row (rendered by story-viewer.tsx at right-3 bottom-3).
        "absolute end-0 bottom-0 start-0 z-31 ps-4 pe-16 pt-3 pb-3 pointer-events-auto",
        "bg-linear-to-t from-media-overlay via-media-overlay/70 to-transparent",
        className,
      )}
    >
      <CommentComposer
        ref={composerRef}
        currentUser={currentUser}
        value={text}
        placeholder={labels.replyComposerPlaceholder(story)}
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
        // F-05: the pill is a scrim of its own (not the theme's translucent input fill), so it
        // stays legible over a bright photo in the dark theme too.
        className="[&_textarea]:min-h-9 [&_textarea]:py-1.5 [&_textarea]:text-sm [&_textarea]:bg-media-overlay! [&_textarea]:text-media-overlay-foreground! [&_textarea]:border-media-overlay-foreground/40! [&_textarea]:placeholder:text-media-overlay-foreground/70!"
        submitOnEnter
        minRows={1}
        maxRows={3}
        ariaLabel={labels.replyAriaLabel(story)}
        labels={
          labels.commentLabels
            ? {
                composerPlaceholder: labels.commentLabels.composerPlaceholder,
                composerSend: labels.commentLabels.composerSend ?? labels.replyComposerSend,
                composerCancel: labels.commentLabels.composerCancel ?? labels.replyComposerCancel,
              }
            : {
                composerSend: labels.replyComposerSend,
                composerCancel: labels.replyComposerCancel,
              }
        }
      />
    </div>
  );
}

export const ReplyComposer = memo(ReplyComposerInner);
ReplyComposer.displayName = "ReplyComposer";

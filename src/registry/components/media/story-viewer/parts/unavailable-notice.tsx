import type { ResolvedStoryViewer01Labels, StoryItemUnavailableReason } from "../types";

export interface UnavailableNoticeProps {
  /** Why the item cannot play: `"removed"` · `"resolve"` · `"media"` · `"timeout"`. Exposed as `data-story-unavailable`. */
  reason: StoryItemUnavailableReason;
  labels: ResolvedStoryViewer01Labels;
  /** Show the close button (the notice stays: `standalone` single-item story). */
  showClose: boolean;
  onClose: () => void;
}

/**
 * Frame shown in place of an item that cannot play (removed, unresolvable, failed media, load
 * timeout). A polite status region carries `labels.unavailable`; when the notice stays (a
 * `standalone` single-item story) a close button (`labels.unavailableClose`) ends the viewer.
 *
 * The close button sits above the tap zones (z-20) and opts out of swipe / long-press gestures
 * through its `button` role like every other control.
 */
export function UnavailableNotice({
  reason,
  labels,
  showClose,
  onClose,
}: UnavailableNoticeProps) {
  return (
    <div
      data-story-unavailable={reason}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-media-overlay-foreground"
    >
      <p role="status" aria-live="polite" className="text-sm font-medium">
        {labels.unavailable}
      </p>
      {showClose ? (
        <button
          type="button"
          onClick={onClose}
          className="relative z-20 rounded-full bg-media-overlay-foreground/15 px-4 py-2 text-sm font-medium text-media-overlay-foreground transition-colors hover:bg-media-overlay-foreground/25 focus-visible:bg-media-overlay-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-media-overlay-foreground/40"
        >
          {labels.unavailableClose}
        </button>
      ) : null}
    </div>
  );
}

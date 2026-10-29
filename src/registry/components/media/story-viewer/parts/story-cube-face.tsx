import { useState } from "react";
import { ProgressBars } from "./progress-bars";
import { ViewerHeader } from "./viewer-header";
import type { ResolvedStoryViewer01Labels, Story, StoryItem } from "../types";

export interface StoryCubeFaceProps {
  story: Story;
  item: StoryItem;
  itemIndex: number;
  progress: number;
  isMuted: boolean;
  /** Playable URL for the item (`item.src` or a resolved one). No media element mounts without it. */
  src?: string;
  labels: ResolvedStoryViewer01Labels;
  /** Same `renderHeaderBadge` as the live header, so the badge does not pop in when the face lands. */
  renderBadge?: (story: Story, item: StoryItem) => React.ReactNode;
}

/**
 * v0.4.0 — Static ghost render of the LEAVING story during a cube
 * transition. Renders progress bars + header chrome + the bare media
 * element (image or video poster), all visually frozen. No interactivity
 * (pointer-events: none on the host face). Lives ~`durationMs` and then
 * unmounts.
 *
 * For video items we mount a raw `<video>` with `preload="metadata"` and
 * no autoplay — it shows the first frame as a poster. The fully-fledged
 * VideoPlayer is intentionally NOT used here (a fresh mount would
 * restart playback from t=0 on the ghost face, which is jankier than a
 * static poster).
 */
export function StoryCubeFace({
  story,
  item,
  itemIndex,
  progress,
  isMuted,
  src,
  labels,
  renderBadge,
}: StoryCubeFaceProps) {
  // 0.7.0 - a ghost image that fails to load is hidden (no broken-image glyph on the swiping face).
  // 0.7.1 (FU-13) - a ghost video too (some browsers draw an error box over a failed `<video>`).
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  return (
    <>
      <ProgressBars
        items={story.items}
        currentItemIndex={itemIndex}
        progress={progress}
      />
      <ViewerHeader
        story={story}
        item={item}
        isPaused={false}
        isMuted={isMuted}
        onTogglePause={() => {}}
        onToggleMute={() => {}}
        onClose={() => {}}
        formatTime={labels.formatTime}
        labels={labels}
        renderBadge={renderBadge}
      />
      <div className="absolute inset-0">
        {src === undefined ? null : item.type === "image" ? (
          <img
            src={src}
            alt={labels.itemImageAlt(story, itemIndex, story.items.length)}
            className="h-full w-full object-cover"
            style={brokenSrc === src ? { visibility: "hidden" } : undefined}
            onError={() => setBrokenSrc(src)}
          />
        ) : (
          <video
            src={src}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            style={brokenSrc === src ? { visibility: "hidden" } : undefined}
            onError={() => setBrokenSrc(src)}
          />
        )}
      </div>
    </>
  );
}

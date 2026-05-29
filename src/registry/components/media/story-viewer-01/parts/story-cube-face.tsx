import { ProgressBars } from "./progress-bars";
import { ViewerHeader } from "./viewer-header";
import type { ResolvedStoryViewer01Labels, Story, StoryItem } from "../types";

export interface StoryCubeFaceProps {
  story: Story;
  item: StoryItem;
  itemIndex: number;
  progress: number;
  isMuted: boolean;
  labels: ResolvedStoryViewer01Labels;
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
 * VideoPlayer01 is intentionally NOT used here (a fresh mount would
 * restart playback from t=0 on the ghost face, which is jankier than a
 * static poster).
 */
export function StoryCubeFace({
  story,
  item,
  itemIndex,
  progress,
  isMuted,
  labels,
}: StoryCubeFaceProps) {
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
      />
      <div className="absolute inset-0">
        {item.type === "image" ? (
          <img
            src={item.src}
            alt={labels.itemImageAlt(story, itemIndex, story.items.length)}
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={item.src}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </>
  );
}

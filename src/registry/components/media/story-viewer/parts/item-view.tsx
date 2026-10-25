// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { VideoPlayer } from "../../video-player/video-player";
import type {
  RenderItemContext,
  ResolvedStoryViewer01Labels,
  Story,
  StoryItem,
} from "../types";

export interface ItemViewProps {
  item: StoryItem;
  story: Story;
  totalItems: number;
  cursor: { storyIndex: number; itemIndex: number };
  isPaused: boolean;
  isMuted: boolean;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  /** The item can start counting down: image loaded (or failed / was cached), video started (or failed). */
  onReady?: () => void;
  /** Video media time in seconds (`currentTime`, `duration`). */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** The video failed to load. Counts as ready; the caller falls back to the timer. */
  onVideoError?: () => void;
  /** Story-qualified key for the media element (stories may reuse item ids). Defaults to `item.id`. */
  mediaKey?: string;
  renderItem?: (item: StoryItem, context: RenderItemContext) => React.ReactNode;
  labels: ResolvedStoryViewer01Labels;
}

export function ItemView({
  item,
  story,
  totalItems,
  cursor,
  isPaused,
  isMuted,
  onLoadedMetadata,
  onEnded,
  onReady,
  onTimeUpdate,
  onVideoError,
  mediaKey,
  renderItem,
  labels,
}: ItemViewProps) {
  const elementKey = mediaKey ?? item.id;
  if (renderItem) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {renderItem(item, {
          storyIndex: cursor.storyIndex,
          itemIndex: cursor.itemIndex,
          isPaused,
          isMuted,
        })}
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          key={elementKey}
          ref={(el) => {
            // Cached / already-decoded image: `load` fired before we attached.
            if (el && el.complete) onReady?.();
          }}
          src={item.src}
          alt={labels.itemImageAlt(story, cursor.itemIndex, totalItems)}
          className="h-full w-full object-cover"
          onLoad={onReady}
          // A failed image counts as ready — the story must never freeze on it.
          onError={onReady}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <VideoPlayer
        key={elementKey}
        src={item.src}
        isActive={!isPaused}
        muted={isMuted}
        loop={false}
        autoPlay
        controls={false}
        objectFit="cover"
        className="h-full w-full"
        videoClassName="h-full w-full"
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onPlay={onReady}
        onTimeUpdate={(currentTime, duration) => {
          if (currentTime > 0) onReady?.();
          onTimeUpdate?.(currentTime, duration);
        }}
        onError={() => {
          onReady?.();
          onVideoError?.();
        }}
      />
    </div>
  );
}

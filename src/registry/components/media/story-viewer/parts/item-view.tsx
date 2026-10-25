// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { useRef } from "react";
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
  /** Playable URL (`item.src`, a resolved URL or a retry URL). `undefined` while resolving: no media mounts. */
  src: string | undefined;
  /** Poster for a video item (from `resolveMedia`). */
  poster?: string;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  /** The item can start counting down: image loaded (or failed / was cached), video started (or failed). */
  onReady?: () => void;
  /** Video media time in seconds (`currentTime`, `duration`). */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** The video failed to load (every error event). The caller decides: timer fallback, retry or unavailable. */
  onVideoError?: () => void;
  /** The image failed to load (once per element). Without it a failed image counts as ready. */
  onImageError?: () => void;
  /** A custom `renderItem` frame called `ctx.onError`. */
  onFrameError?: () => void;
  /**
   * Passed to the video player's `onMediaError` (it asks once, swaps the URL and resumes at the same
   * time). When set, a failing video is not counted as ready: the retry is pending.
   */
  videoMediaError?: (failedSrc: string) => Promise<string | void>;
  /** Story-qualified key for the media element (stories may reuse item ids). Defaults to `item.id`. */
  mediaKey?: string;
  renderItem?: (item: StoryItem, context: RenderItemContext) => React.ReactNode;
  labels: ResolvedStoryViewer01Labels;
}

const noop = () => {};
const noopProgress: (currentTime: number, duration: number) => void = () => {};

export function ItemView({
  item,
  story,
  totalItems,
  cursor,
  isPaused,
  isMuted,
  src,
  poster,
  onLoadedMetadata,
  onEnded,
  onReady,
  onTimeUpdate,
  onVideoError,
  onImageError,
  onFrameError,
  videoMediaError,
  mediaKey,
  renderItem,
  labels,
}: ItemViewProps) {
  const elementKey = mediaKey ?? item.id;
  // An element is reported broken once.
  const reportedBroken = useRef(new WeakSet<HTMLImageElement>());
  // Elements that fired `error`, and elements already reported ready through the `complete` check.
  // A failed `<img>` also has `complete === true`, and React 19 re-runs an inline ref on every
  // render, so neither a failure nor a repeat render may mark an element ready.
  const failedImages = useRef(new WeakSet<HTMLImageElement>());
  const readyImages = useRef(new WeakSet<HTMLImageElement>());
  if (renderItem) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {renderItem(item, {
          storyIndex: cursor.storyIndex,
          itemIndex: cursor.itemIndex,
          isPaused,
          isMuted,
          src,
          poster,
          onReady: onReady ?? noop,
          onEnded,
          onProgress: onTimeUpdate ?? noopProgress,
          onError: onFrameError ?? noop,
        })}
      </div>
    );
  }

  // Resolving (no URL yet): nothing to mount, the item is not ready.
  if (src === undefined) return null;

  if (item.type === "image") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          key={`${elementKey}|${src}`}
          ref={(el) => {
            // Cached / already-decoded image: `load` fired before we attached. Once per element,
            // and never for a failed one (a failed image is `complete` with no intrinsic size).
            if (!el || !el.complete || readyImages.current.has(el)) return;
            if (el.naturalWidth === 0 && failedImages.current.has(el)) return;
            readyImages.current.add(el);
            onReady?.();
          }}
          src={src}
          alt={labels.itemImageAlt(story, cursor.itemIndex, totalItems)}
          className="h-full w-full object-cover"
          onLoad={onReady}
          // A failed image counts as ready — the story must never freeze on it —
          // unless the caller takes the failure over (retry / unavailable).
          onError={(e) => {
            failedImages.current.add(e.currentTarget);
            if (!onImageError) {
              onReady?.();
              return;
            }
            if (reportedBroken.current.has(e.currentTarget)) return;
            reportedBroken.current.add(e.currentTarget);
            onImageError();
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <VideoPlayer
        key={elementKey}
        src={src}
        poster={poster}
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
        onMediaError={videoMediaError}
        onError={() => {
          // With a media-error handler the retry is pending: not ready yet.
          if (!videoMediaError) onReady?.();
          onVideoError?.();
        }}
      />
    </div>
  );
}

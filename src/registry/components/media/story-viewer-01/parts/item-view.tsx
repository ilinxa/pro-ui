// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { VideoPlayer01 } from "../../video-player-01/video-player-01";
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
  renderItem,
  labels,
}: ItemViewProps) {
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
          src={item.src}
          alt={labels.itemImageAlt(story, cursor.itemIndex, totalItems)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <VideoPlayer01
        key={item.id}
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
      />
    </div>
  );
}

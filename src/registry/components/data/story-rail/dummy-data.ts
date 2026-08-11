import type { StoryRailDelta, StoryRailItem, Subscribe } from "./types";

/** 7 mock users — kasder's `mockStories` array, mapped to the rail's preview shape. */
export const DUMMY_STORIES: StoryRailItem[] = [
  {
    id: "1",
    userId: "u1",
    username: "mehmet",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    previewImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    hasUnread: true,
  },
  {
    id: "2",
    userId: "u2",
    username: "ayse",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    previewImage:
      "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800",
    hasUnread: true,
  },
  {
    id: "3",
    userId: "u3",
    username: "ali",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    previewImage:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800",
    hasUnread: true,
  },
  {
    id: "4",
    userId: "u4",
    username: "fatma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    previewImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    hasUnread: false,
  },
  {
    id: "5",
    userId: "u5",
    username: "mustafa",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100",
    previewImage:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    hasUnread: true,
  },
  {
    id: "6",
    userId: "u6",
    username: "zeynep",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
    previewImage:
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
    hasUnread: false,
  },
  {
    id: "7",
    userId: "u7",
    username: "emre",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100",
    previewImage:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
    hasUnread: true,
  },
];

/** Viewer fixture for the AddStoryThumbnail demo. */
export const DUMMY_VIEWER_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100";

const LIVE_STORY_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80",
];

const LIVE_STORY_PREVIEWS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop&q=80",
];

/** Sandbox-only fake subscribe — synthetic deltas every 5s. */
export function createDummyStoryRailSubscribe(): Subscribe<StoryRailDelta> {
  return (handler) => {
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      const variant = tick % 3;
      if (variant === 0) {
        handler({
          kind: "added",
          item: {
            id: `live-${Date.now()}`,
            userId: `live-u-${tick}`,
            username: `live${tick}`,
            avatar: LIVE_STORY_AVATARS[tick % LIVE_STORY_AVATARS.length],
            previewImage: LIVE_STORY_PREVIEWS[tick % LIVE_STORY_PREVIEWS.length],
            hasUnread: true,
          },
          position: "start",
        });
      } else if (variant === 1) {
        handler({ kind: "viewed", itemId: "1" });
      } else {
        handler({
          kind: "updated",
          itemId: "2",
          partial: { hasUnread: true },
        });
      }
    }, 5000);
    return () => clearInterval(id);
  };
}

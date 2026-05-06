import type { Story } from "./types";

const NOW = new Date("2026-05-03T14:00:00Z");

function isoMinusMin(min: number): string {
  return new Date(NOW.getTime() - min * 60_000).toISOString();
}

/**
 * 3 mock stories with mixed image + video content.
 * Video URLs match kasder's locked test set (w3schools).
 */
export const STORY_VIEWER_01_DUMMY: Story[] = [
  {
    id: "story-1",
    userId: "user-1",
    username: "ayse_yilmaz",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    hasUnread: true,
    createdAt: isoMinusMin(15),
    items: [
      {
        id: "story-1-item-1",
        type: "image",
        src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=900&h=1600&fit=crop",
        duration: 5,
      },
      {
        id: "story-1-item-2",
        type: "image",
        src: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&h=1600&fit=crop",
        duration: 5,
      },
      {
        id: "story-1-item-3",
        type: "image",
        src: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=900&h=1600&fit=crop",
        duration: 5,
      },
    ],
  },
  {
    id: "story-2",
    userId: "user-2",
    username: "mehmet_demir",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    hasUnread: true,
    createdAt: isoMinusMin(45),
    items: [
      {
        id: "story-2-item-1",
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
      {
        id: "story-2-item-2",
        type: "video",
        src: "https://www.w3schools.com/html/movie.mp4",
      },
    ],
  },
  {
    id: "story-3",
    userId: "user-3",
    username: "zeynep_kaya",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    hasUnread: false,
    createdAt: isoMinusMin(180),
    items: [
      {
        id: "story-3-item-1",
        type: "image",
        src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=1600&fit=crop",
        duration: 5,
      },
      {
        id: "story-3-item-2",
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
    ],
  },
];

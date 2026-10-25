import { Heart, Laugh, ThumbsUp } from "lucide-react";
import { createElement } from "react";
import type {
  Story,
  StoryCurrentUser,
  StoryEngagementReactionKind,
  ViewerListItem,
} from "./types";

const NOW = new Date("2026-05-03T14:00:00Z");

function isoMinusMin(min: number): string {
  return new Date(NOW.getTime() - min * 60_000).toISOString();
}

/**
 * 3 mock stories with mixed image + video content.
 * Video URLs match kasder's locked test set (w3schools).
 */
export const STORY_VIEWER_DUMMY: Story[] = [
  {
    id: "story-1",
    userId: "user-1",
    username: "ayse_yilmaz",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    hasUnread: true,
    createdAt: isoMinusMin(15),
    // v0.2.0 — owner-mode overlay sample data.
    viewerCount: 47,
    items: [
      {
        id: "story-1-item-1",
        type: "image",
        src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=900&h=1600&fit=crop",
        duration: 5,
        // 0.6.0 - per-item caption, time, view count and initial engagement tallies.
        caption: "Spring collection is here - first look",
        createdAt: isoMinusMin(15),
        viewerCount: 47,
        engagement: { likeCount: 12, liked: false, reactionCount: 23, replyCount: 4 },
        // v0.2.0 — link CTA bottom button.
        link: {
          url: "https://example.com/shop/spring-collection",
          cta: "Shop now",
        },
      },
      {
        id: "story-1-item-2",
        type: "image",
        src: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&h=1600&fit=crop",
        duration: 5,
        caption: "Behind the scenes",
        createdAt: isoMinusMin(9),
        viewerCount: 31,
        engagement: { likeCount: 5, liked: true, reactionCount: 7, replyCount: 0 },
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

// ─── v0.2.0 — additional sample data for engagement / owner / link demos ──

/** Sample current viewer for the v0.2.0 viewer-mode + reply composer demos. */
export const STORY_VIEWER_DUMMY_CURRENT_USER: StoryCurrentUser = {
  id: "user-current",
  name: "Sen",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
};

/** Sample reaction kinds for the engagement overlay's reaction action. */
export const STORY_VIEWER_DUMMY_REACTION_KINDS: StoryEngagementReactionKind[] =
  [
    {
      key: "like",
      icon: createElement(ThumbsUp, { className: "h-6 w-6" }),
      label: "Like",
      count: 12,
    },
    {
      key: "love",
      icon: createElement(Heart, { className: "h-6 w-6" }),
      label: "Love",
      count: 8,
      color: "#ef4444",
    },
    {
      key: "laugh",
      icon: createElement(Laugh, { className: "h-6 w-6" }),
      label: "Haha",
      count: 3,
    },
  ];

/** Sample viewers list for the owner-mode overlay (eager seed). */
export const STORY_VIEWER_DUMMY_VIEWERS: ViewerListItem[] = [
  {
    id: "viewer-1",
    name: "Emre Demir",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    viewedAt: new Date("2026-05-03T13:55:00Z").toISOString(),
  },
  {
    id: "viewer-2",
    name: "Selin Ak",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    viewedAt: new Date("2026-05-03T13:50:00Z").toISOString(),
  },
  {
    id: "viewer-3",
    name: "Burak Kaya",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    viewedAt: new Date("2026-05-03T13:45:00Z").toISOString(),
  },
  {
    id: "viewer-4",
    name: "Defne Yıldız",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop",
    viewedAt: new Date("2026-05-03T13:30:00Z").toISOString(),
  },
];

// ─── 0.6.0 - muted group + Arabic (RTL) samples ───────────────────────────

/**
 * A host-muted group: the viewer skips it on every sequential move (auto-advance, tap, arrow
 * keys, swipe). Open it directly with `initialStoryIndex` and it still plays.
 */
export const STORY_VIEWER_DUMMY_MUTED: Story = {
  id: "story-muted",
  userId: "user-muted",
  username: "muted_account",
  muted: true,
  hasUnread: true,
  createdAt: isoMinusMin(60),
  items: [
    {
      id: "story-muted-item-1",
      type: "image",
      src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&h=1600&fit=crop",
      duration: 5,
      caption: "You muted this account - the viewer skips it",
    },
  ],
};

/** Arabic sample stories for the RTL demo (author names, captions). */
export const STORY_VIEWER_DUMMY_AR: Story[] = [
  {
    id: "story-ar-1",
    userId: "user-ar-1",
    username: "ليلى_العتيبي",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    hasUnread: true,
    createdAt: isoMinusMin(20),
    viewerCount: 52,
    items: [
      {
        id: "story-ar-1-item-1",
        type: "image",
        src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=900&h=1600&fit=crop",
        duration: 5,
        caption: "صباح الخير من الرياض - أول رحلة لهذا الموسم",
        createdAt: isoMinusMin(20),
        engagement: { likeCount: 18, liked: false, reactionCount: 9, replyCount: 3 },
      },
      {
        id: "story-ar-1-item-2",
        type: "image",
        src: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=900&h=1600&fit=crop",
        duration: 5,
        caption: "غروب الشمس فوق الصحراء",
        createdAt: isoMinusMin(12),
      },
    ],
  },
  {
    id: "story-ar-2",
    userId: "user-ar-2",
    username: "خالد_المنصور",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    hasUnread: false,
    createdAt: isoMinusMin(95),
    items: [
      {
        id: "story-ar-2-item-1",
        type: "image",
        src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=1600&fit=crop",
        duration: 5,
        caption: "قهوة المساء مع الأصدقاء",
        createdAt: isoMinusMin(95),
      },
    ],
  },
];

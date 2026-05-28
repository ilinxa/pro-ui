import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "story-viewer-01",
  name: "Story Viewer 01",
  category: "media",

  description:
    "Full-screen sequential story viewer — Radix Dialog modal with segmented progress, tap zones, keyboard nav, multi-story navigation, video composition via video-player-01, and a Subscribe<StoryViewerDelta> realtime contract.",
  context:
    "Use anywhere stories appear — Instagram-style modal viewer over a feed. Pairs with story-rail-01 (the seventh ship) which fires onItemClick(item, index); host opens <StoryViewer01 isOpen stories={...} initialStoryIndex={index} onClose={...} /> in response. The viewer's onStoryViewed(storyId) callback is what hosts wire back into railRef.current.markViewed(storyId) to clear the unread ring — viewer is fully decoupled from the rail. Image and video items both supported (video composes media/video-player-01). v0.1 ships click-outside + Escape close + arrow-key nav; framer-motion swipe-to-dismiss is the locked v0.2 adoption gate. Migration origin: kasder kas-social-front-v0 StoryViewer.tsx; eighth and final ship in the social-posts-system arc.",
  features: [
    "Radix Dialog modal — focus trap + portal + Escape + backdrop click free",
    "Mobile full-screen (h-dvh) / desktop centered portrait modal (md:h-175 md:w-100)",
    "Segmented progress bars (one per item; CSS `transition-[width]` fill; ARIA progressbar)",
    "Pause-preserving accumulator-based progress timer (fixes kasder's ~50ms drift per pause/resume)",
    "Item duration resolution: explicit `item.duration` → video metadata → default fallback",
    "Tap zones: left=prev item / middle=pause / right=next item (mobile + desktop)",
    "Desktop nav arrows: ← → between stories (story-level navigation)",
    "Keyboard nav: ArrowLeft/Right (item nav) + Space (pause) + Escape (close)",
    "Header: avatar + username + relative time + pause/play + mute (video only) + close",
    "video-player-01 composed for video items (cross-folder via registryDependencies)",
    "Subscribe<StoryViewerDelta> realtime contract: story-added / story-removed / item-added / item-removed / story-viewed",
    "ID-anchored cursor (NOT index-based) — story/item insertions / removals don't desync the cursor",
    "Always-uncontrolled state with `reset(next)` + `dispatch(action)` imperative escape hatches (matches story-rail-01 / post-card-01 / comment-thread-01)",
    "Cursor reset on (initialStoryIndex, isOpen) pair change — re-opening with same initialStoryIndex still goes back to item 0",
    "Forward-only `onStoryViewed` semantics (matches Instagram — backward navigation doesn't mark viewed)",
    "Auto-close at end of last story with synchronous `onAutoCloseAtEnd` callback before `onClose`",
    "renderItem slot for custom item types (Lottie, polls, sponsored, etc.)",
    "useStoryProgress + useStoryKeyboardNav exported standalone for advanced consumers",
    "i18n via 10-key labels object (defaults to English + native Intl.DateTimeFormat)",
    "a11y: DialogTitle (sr-only) + per-button aria-labels + per-segment role=progressbar with aria-valuenow",
  ],
  tags: ["story-viewer-01", "story", "viewer", "modal", "dialog", "media", "social"],

  version: "0.1.2",
  status: "alpha",
  createdAt: "2026-05-03",
  updatedAt: "2026-05-23",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["dialog", "avatar", "button"],
    npm: { "lucide-react": "^1.11.0" },
    internal: ["video-player-01", "engagement-bar-01"],
  },

  related: ["story-rail-01", "video-player-01", "media-carousel-01", "post-card-01"],
};

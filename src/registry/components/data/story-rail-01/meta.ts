import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "story-rail-01",
  name: "Story Rail 01",
  category: "data",

  description:
    "Horizontal stories rail (kasder-exact) — gradient ring on unread, muted ring on read; AddStoryThumbnail standalone export + leading slot for any custom prefix; Embla used inline (drag-free skim-scroll, no indicator dots); mode-aware edge-fade gradients (framed vs bare); realtime via Subscribe<StoryRailDelta>. Decoupled from the viewer — onItemClick hands off to host. Always-uncontrolled with reset() + dispatch() + markViewed() imperative escape hatches. No new shadcn primitives; Embla peer dep already shared with media-carousel-01.",
  context:
    "Seventh of 8 in the social-posts-system arc — story doublet, part 1. Embla used directly (sealed-folder rule — story-rail's start-aligned + drag-free + small-rectangle config differs structurally from media-carousel-01's centered + snap + large-square gallery). Migration origin: kasder kas-social-front-v0 StoriesSection.tsx + StoryThumbnail.tsx. Realtime contract identical shape to engagement-bar-01 / comment-thread-01 / post-card-01 — single Subscribe<TDelta> mental model across the family. Click does NOT auto-mark-viewed (matches Instagram); host calls ref.current.markViewed(itemId) when their viewer closes. Gradient color adapts to framed mode: from-card when wrapped in card chrome (kasder convention), from-background when bare. Pairs with the upcoming story-viewer-01 (eighth ship; FM adoption gate) for the full doublet — viewer takes the FULL Story shape with items[] inner content; rail takes a minimal preview shape. TypeScript structural typing means hosts can pass a Story to story-rail-01 if its fields are a superset; no adapter needed.",
  features: [
    "Kasder-exact thumbnail aesthetic — w-20 h-28 portrait, gradient ring (unread) vs muted ring (read), avatar+username row below",
    "AddStoryThumbnail standalone sub-export — dashed-border placeholder + 50%-opacity user avatar + Plus badge",
    "leading?: ReactNode slot — render any custom prefix (AddStoryThumbnail / Live indicator / Pinned callout / etc.)",
    "Realtime via Subscribe<StoryRailDelta> contract — added / removed / viewed / updated; same shape as engagement-bar-01 / comment-thread-01 / post-card-01",
    "onSubscribeDelta callback fires for every delta",
    "Embla used inline (no wrapper hook, no cross-import) — align: 'start', containScroll: 'trimSnaps', dragFree: true (kasder-exact)",
    "No indicator dots — story rails are skim-scroll, not snap carousels",
    "Mode-aware edge gradients — from-card + left-4/right-4 when framed; from-background + left-0/right-0 when bare",
    "Edge gradients render only when items present (not over empty state)",
    "Click does NOT auto-mark-viewed — host owns viewing semantics via ref.current.markViewed(itemId)",
    "renderThumbnail slot for full per-thumbnail takeover (themed rings, video previews, custom shapes)",
    "Polymorphic linkComponent + getHref for navigation-mode (rare; thumbnails usually open modal viewer)",
    "Imperative handle: scrollTo / getCurrentItems / reset / dispatch / markViewed",
    "storyRailReducer + useStoryRailState publicly exported (external state coordination)",
    "Always-uncontrolled — `items` prop is mount-only; reset(next) for external state push",
    "i18n via 5-key labels object including thumbnailAriaLabel(item) function for unread/viewed string",
    "a11y — section role=region, button per thumbnail with descriptive aria-label, edge gradients aria-hidden",
    "motion-safe:group-hover:scale-105 on thumbnails — reduced-motion users see static",
    "Tailwind v4-clean (no legacy class names)",
    "No new shadcn primitives — avatar already installed",
    "No framer-motion — CSS transitions only",
  ],
  tags: [
    "story-rail-01",
    "social",
    "stories",
    "rail",
    "carousel",
    "embla",
    "realtime",
    "instagram",
  ],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-03",
  updatedAt: "2026-05-09",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["avatar"],
    npm: {
      "embla-carousel-react": "^8.6.0",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: [
    "story-viewer-01",
    "post-card-01",
    "media-carousel-01",
    "comment-thread-01",
    "engagement-bar-01",
  ],
};

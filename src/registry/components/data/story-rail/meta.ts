import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "story-rail",
  name: "Story Rail",
  category: "data",

  description:
    "Horizontal story rail with unread gradient rings, drag-free skim scrolling, an add-story tile, and edge-fade gradients.",
  context:
    "Seventh of 8 in the social-posts-system arc — story doublet, part 1. Embla used directly (sealed-folder rule — story-rail's start-aligned + drag-free + small-rectangle config differs structurally from media-carousel's centered + snap + large-square gallery). Migration origin: kasder kas-social-front-v0 StoriesSection.tsx + StoryThumbnail.tsx. Realtime contract identical shape to engagement-bar / comment-thread / post-card — single Subscribe<TDelta> mental model across the family. Click does NOT auto-mark-viewed (matches Instagram); host calls ref.current.markViewed(itemId) when their viewer closes. Gradient color adapts to framed mode: from-card when wrapped in card chrome (kasder convention), from-background when bare. Pairs with the upcoming story-viewer (eighth ship; FM adoption gate) for the full doublet — viewer takes the FULL Story shape with items[] inner content; rail takes a minimal preview shape. TypeScript structural typing means hosts can pass a Story to story-rail if its fields are a superset; no adapter needed.",
  features: [
    "Kasder-exact thumbnail aesthetic — w-20 h-28 portrait, gradient ring (unread) vs muted ring (read), avatar+username row below",
    "AddStoryThumbnail standalone sub-export — dashed-border placeholder + 50%-opacity user avatar + Plus badge",
    "leading?: ReactNode slot — render any custom prefix (AddStoryThumbnail / Live indicator / Pinned callout / etc.)",
    "Realtime via Subscribe<StoryRailDelta> contract — added / removed / viewed / updated; same shape as engagement-bar / comment-thread / post-card",
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
    "v0.2.1 — usage.tsx docs patch: 3 stale positional `onItemClick(item, index)` snippets + 1 prose mention updated to object-shape `({ item, index })` (v0.2 contract). Zero code change.",
  ],
  tags: [
    "story-rail",
    "social",
    "stories",
    "rail",
    "carousel",
    "embla",
    "realtime",
    "instagram",
  ],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 25,
  createdAt: "2026-05-03",
  updatedAt: "2026-08-11",

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
    "story-viewer",
    "post-card",
    "media-carousel",
    "comment-thread",
    "engagement-bar",
  ],
};

import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "story-rail",
  name: "Story Rail",
  category: "data",

  description:
    "Horizontal story rail with unread gradient rings, drag-free skim scrolling, optional arrows, an add-story tile, and scroll-aware edge fades.",
  context:
    "Seventh of 8 in the social-posts-system arc — story doublet, part 1. Embla used directly (sealed-folder rule — story-rail's start-aligned + drag-free + small-rectangle config differs structurally from media-carousel's centered + snap + large-square gallery). Migration origin: kasder kas-social-front-v0 StoriesSection.tsx + StoryThumbnail.tsx. Realtime contract identical shape to engagement-bar / comment-thread / post-card — single Subscribe<TDelta> mental model across the family. Click does NOT auto-mark-viewed (matches Instagram); host calls ref.current.markViewed(itemId) when their viewer closes. Edge fades adapt to framed mode (from-card when wrapped in card chrome, from-background when bare) and show only on a side the rail can scroll toward. v0.4 hardening for the ilinxa Social Platform: optional preview with an avatar-card fallback, story-ring tokens, muted authors, opt-in arrows, controlled items, RTL. Pairs with story-viewer for the full doublet — viewer takes the FULL Story shape with items[] inner content; rail takes a minimal preview shape. TypeScript structural typing means hosts can pass a Story to story-rail if its fields are a superset; no adapter needed.",
  features: [
    "Kasder-exact thumbnail aesthetic — w-20 h-28 portrait, gradient ring (unread) vs muted ring (read), avatar+username row below",
    "Optional `previewImage` — absent or failing → avatar card (author avatar on bg-muted); `onPreviewError(item)` can resolve a refreshed URL, retried once; lazy/async `<img>` with width/height/srcSet/sizes",
    "Unread ring from `--story-ring-from` / `--story-ring-to` (item cssVars.theme mappings with fallbacks — your theme wins)",
    "`muted` items — grey ring even when unread, tile + name at reduced opacity; the aria-label function receives the item",
    "Opt-in previous / next arrows (`arrows=\"fine-pointer\" | \"always\"`) — page-wise scroll, hidden where the rail cannot scroll, labelled via `labels`, mirrored in RTL, jump under reduced motion; no wheel scrolling, so arrows are the desktop path",
    "RTL — `dir` prop or the nearest `[dir]` ancestor drives Embla direction; logical positions; mirrored fades",
    "AddStoryThumbnail standalone sub-export — dashed-border placeholder + 50%-opacity user avatar + Plus badge",
    "leading?: ReactNode slot — render any custom prefix (AddStoryThumbnail / Live indicator / Pinned callout / etc.)",
    "Realtime via Subscribe<StoryRailDelta> contract — added / removed / viewed / updated; same shape as engagement-bar / comment-thread / post-card",
    "onSubscribeDelta callback fires for every delta",
    "Embla used inline (no wrapper hook, no cross-import) — align: 'start', containScroll: 'trimSnaps', dragFree: true (kasder-exact)",
    "No indicator dots — story rails are skim-scroll, not snap carousels",
    "Mode-aware, scroll-aware edge fades — from-card when framed, from-background when bare; shown only where the rail can scroll; width via `--story-rail-fade-width` (default 3rem)",
    "Edge gradients render only when items present (not over empty state)",
    "Click does NOT auto-mark-viewed — host owns viewing semantics via ref.current.markViewed(itemId)",
    "renderThumbnail slot for full per-thumbnail takeover (themed rings, video previews, custom shapes)",
    "Polymorphic linkComponent + getHref for navigation-mode (rare; thumbnails usually open modal viewer)",
    "Imperative handle: scrollTo(itemIndex — `leading` not counted) / getCurrentItems / reset / dispatch / markViewed",
    "storyRailReducer + useStoryRailState publicly exported (external state coordination)",
    "Controlled or uncontrolled — `items` + `onItemsChange` (the prop wins every render; mutations and realtime deltas are reported) or `defaultItems`; `items` alone keeps the read-once behaviour with a dev warning",
    "i18n via the labels object (rail, Add tile, arrows, empty state, thumbnailAriaLabel(item)) — `AddStoryThumbnail` reads the rail's labels from context; its own props still win",
    "a11y — section role=region, button per thumbnail with descriptive aria-label, edge gradients aria-hidden",
    "motion-safe:group-hover:scale-105 on thumbnails — reduced-motion users see static",
    "Tailwind v4-clean (no legacy class names)",
    "No new shadcn primitives — avatar already installed",
    "No framer-motion — CSS transitions only",
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

  version: "0.4.0",
  status: "alpha",
  artifactBudgetKB: 46,
  createdAt: "2026-05-03",
  updatedAt: "2026-10-23",

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

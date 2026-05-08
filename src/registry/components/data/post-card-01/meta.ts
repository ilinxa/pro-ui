import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "post-card-01",
  name: "Post Card 01",
  category: "data",

  description:
    "Tier-2 social-post composite — 4 variants (feed / compact / list / detail) composing expandable-text-01 + media-carousel-01 + engagement-bar-01 + comment-thread-01 (detail) + video-player-01 (transitive). Inline engagement panels (likes / comments / share) default-on, kasder-style. Auto-wires heart-burst on double-tap. Slot-based render escape hatches at every connective seam. Optional overlay-link via getHref. Always-uncontrolled with reset() imperative escape hatch.",
  context:
    "Sixth ship in the 8-component social-posts-system arc. Third cross-folder import precedent in pro-ui (after media-carousel-01 → video-player-01 and comment-thread-01 → expandable-text-01 + engagement-bar-01) — declares all five Tier-1 social-posts siblings as registryDependencies; consumer install auto-pulls the family. Migration origin: kasder kas-social-front-v0 AdvancedPostCard.tsx (167 LOC) + PostEngagementPanel.tsx inline-panel UX. Component owns a stateful local mirror initialized from `post` on mount (R-Plan-1) — engagement bar runs always-controlled with mirror values, optimistic onLike/onBookmark dispatches mirror first then fires host handler, realtime engagementSubscribe deltas patch mirror + fire onSubscribeEngagementDelta callback. Inline panels (engagementMode default 'inline'): tap heart toggles like, tap count opens likers strip; tap comment toggles inline CommentThread01 (with composer); tap share opens searchable user list. `engagementMode='navigate'` deactivates panels for hosts that prefer page navigation. Heart-burst heuristic auto-wires when `post.media?.length > 0` AND `onLike` AND `variant ∈ {feed, detail}` (disableHeartBurst opts out). `getHref` double-duty: overlay-link in non-detail variants + Copy-link kebab item. Detail variant embeds <CommentThread01> always (ignores engagementMode) with auto-default + `renderCommentSection` slot for full takeover.",
  features: [
    "4 variants: feed (Instagram-post) / compact (sidebar widget) / list (admin row, full-height thumb) / detail (full page + embedded thread)",
    "Composes 5 Tier-1 social siblings via cross-folder imports (declared registryDependencies)",
    "Inline engagement panels DEFAULT — tap heart to like, tap count to open likers strip; tap comment for inline thread+composer; tap share for searchable user list",
    "engagementMode='navigate' opt-out for hosts that prefer page-navigation UX (single-button like, comment fires onComment(id))",
    "LikersStrip part — horizontal swipable avatar strip + paginating +N pill (touch swipe + desktop drag-to-scroll)",
    "ShareMenu part — searchable user picker; local filter when no async wired, optional onShareSearch for backend search",
    "Auto-wired canonical heart-burst on double-tap (heuristic; disableHeartBurst opt-out)",
    "Local engagement mirror — bar runs always-controlled, realtime + optimistic flow into single source of truth",
    "Wrapped engagement handlers — defaultPostEngagementActions(post, handlers, variant, onLikeCountClick?) gets pre-wrapped handlers",
    "Default kebab — Bookmark / Share / Copy link / Report; each item only when handler wired",
    "kebabActions slot for full takeover (moderator semantics)",
    "engagementActions slot — defaultPostEngagementActions exported for extend-not-replace",
    "Overlay-link via getHref + linkComponent (polymorphic root) — non-detail variants only",
    "Two separate subscribe props (engagementSubscribe + commentSubscribe) — distinct delta types stay distinct",
    "Embedded CommentThread01 in detail variant + renderCommentSection slot",
    "renderHeader / renderContent / renderMedia / renderEngagementBar slots — full takeover at every seam",
    "Imperative handle: openKebab / triggerLike (bar + burst) / getCurrentPost / reset / getEngagementHandle / getThreadHandle",
    "VerifiedBadge sub-export — RSC-compatible (no `\"use client\"`)",
    "Always-uncontrolled — `post` prop is mount-only; ref.current.reset(next) for external state push",
    "Tailwind v4-clean (no legacy class names)",
    "No new shadcn primitives needed (avatar / button / card / dropdown-menu / input / popover present)",
    "No framer-motion — inherits engagement-heart-burst CSS from engagement-bar-01",
    "Uses the `engagement-bar-01` like-action `onCountClick` split (heart vs count) when in inline mode",
  ],
  tags: [
    "post-card-01",
    "social",
    "post",
    "tier-2",
    "composite",
    "feed",
    "detail",
    "compact",
    "list",
    "realtime",
    "heart-burst",
    "inline-panels",
    "share",
    "likers",
  ],

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-03",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["avatar", "button", "dropdown-menu", "input"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [
      "expandable-text-01",
      "media-carousel-01",
      "engagement-bar-01",
      "comment-thread-01",
      "video-player-01",
    ],
  },

  related: [
    "expandable-text-01",
    "media-carousel-01",
    "engagement-bar-01",
    "comment-thread-01",
    "video-player-01",
    "story-rail-01",
    "story-viewer-01",
  ],
};

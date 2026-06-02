import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "content-card-news-01",
  name: "Content Card (News 01)",
  category: "data",

  description:
    "Backend-shaped magazine-style news card with 5 variants (featured / large / medium / small / list). v0.3.0 grows it from a layout-only teaser into an A+ procomp on par with post-card-01: role-aware editor/viewer mode, 19-capability permissions matrix, kebab system with moderator section, paywall gate (media-only, preview replaces excerpt) + sensitive content gate (with compact mode for small variant), editorial badge stack with state/curation split (Breaking/Live/Pinned/Sponsored/Status as overlay + Exclusive/Featured as kicker above title), quoted-article compact preview using variant=small inner, light engagement counts with slot-based engagement-bar-01 composition for article detail pages, structured author byline + publisher attribution, ~50 i18n label keys, 11-method imperative handle.",
  context:
    "First component in the news-domain family (siblings: page-hero-news-01, grid-layout-news-01, related-articles-ribbon-01 queued). v0.3.0 mirrors the post-card-01 v0.3.2 trait set translated into editorial vocabulary (`editor` instead of `owner`; `publish/unpublish/feature` instead of `pin/markSensitive`; `paywall` distinct from `sensitive`). Strictly additive on v0.2: every v0.2.x consumer keeps working unchanged (all new fields/props/labels optional; existing `author` string + `date` field preserved alongside new structured `authorEntity` + `publishedAt`). Engagement-bar-01 is NOT a peer dep — consumers compose it via the `renderEngagementCounts` slot on news article detail pages per the documented integration pattern. F-S1 lock applied for cross-procomp imports (RELATIVE paths to specific files; `CommentMenuItem` reused from comment-thread-01). F-cross-13 defensive DropdownMenu pattern (direct trigger, no asChild). Migration origin: kasder kas-social-front-v0 NewsCard.tsx (v0.1 base; v0.3 expansion is greenfield).",
  features: [
    // v0.1/v0.2 carry
    "5 visual variants — featured / large / medium / small / list — dispatched via single `variant` prop",
    "Overlay-link pattern — whole card clickable; optional `actions` slot for nested interactives",
    "Polymorphic root — `linkComponent` slot accepts NextLink / RemixLink / plain <a>",
    "Soft-fail item shape — only id/title/image required; all other fields optional",
    "Editorial typography via pro-ui-wide --font-serif CSS variable (Playfair Display default)",
    "Localizable — `formatRelativeTime` + `formatDate` callbacks + `labels` object",
    "Theming via `categoryStyles` map + `titleClassName` / `imageClassName` / `className` slots",
    // v0.3 — role-aware
    "v0.3.0 — `viewerMode: 'editor' | 'viewer'` opt-in two-mode toggle (no auto-derivation from identity)",
    "v0.3.0 — 19-capability `ContentCardPermissions` matrix + `canPerformAction(action, item)` universal predicate",
    "v0.3.0 — Moderator section in kebab — orthogonal `canModerate` + `moderatorActions(item)` slot (divider-separated)",
    "v0.3.0 — 16 mutation handlers (12 editor-side + 4 reader-side) separate from engagement",
    // v0.3 — kebab system
    "v0.3.0 — Kebab dropdown integrated in 4 variants (featured/large/medium/list — small skips per density)",
    "v0.3.0 — Dual-mode `defaultContentCardKebabActions` helper: legacy minimal kebab when no role-aware args; role-aware items when any set",
    "v0.3.0 — `kebabActions(item)` full-takeover slot",
    // v0.3 — schema expansion
    "v0.3.0 — 31 new optional `ContentCardItem` fields: slug / authorEntity / publisher / publishedAt / updatedAt / scheduledFor / status / visibility / topics / tags / language / availableTranslations / isPinned / isFeatured / isBreaking / isLive / isExclusive / isSponsored / sponsorLabel / liveUpdateCount / lastLiveUpdateAt / sensitivity / paywall / commentsEnabled / commentCount / likeCount / isLiked / bookmarkCount / isBookmarked / shareCount / quotedArticle",
    "v0.3.0 — `ContentStatus` closed enum (draft/scheduled/published/archived); `NewsVisibility` extensible string union (public/members/subscribers/staff/unlisted + branded)",
    // v0.3 — sub-features
    "v0.3.0 — Editorial badge stack with frozen priority order: Breaking → Live → Exclusive → Featured → Pinned → Sponsored → status (editor mode). Uniform shape across all badges (h-5 + px-1.5 + text-[10px] + uppercase + rounded + shrink-0), hierarchy via saturation: vivid solid (Breaking/Live red) → accent solid (Exclusive amber / Featured primary) → subtle solid (Pinned card-tone / Sponsored / Status). Drop-shadow on vivid tier for legibility against bright hero images.",
    "v0.3.0 — Badge placement split (medium variant): state group (Breaking/Live/Pinned/Sponsored/Status) at top-right overlay; curation group (Exclusive/Featured) as kicker row above title. `NewsBadges` accepts `group: \"all\" | \"state\" | \"curation\"` (default `\"all\"`).",
    "v0.3.0 — Status badge (editor-mode only) for draft/scheduled/archived",
    "v0.3.0 — Visibility badge for non-public access tiers",
    "v0.3.0 — Sponsor badge with `sponsorLabel` template (\"Sponsored by {name}\")",
    "v0.3.0 — Live-update sub-line — \"Updated 3m ago · 14 updates\" when isLive + lastLiveUpdateAt set",
    "v0.3.0 — Paywall gate over MEDIA only — title + author + footer + engagement counts stay visible. `paywall.preview` substitutes for `item.excerpt` in the body (variants compute `displayExcerpt = paywall.preview ?? item.excerpt`). Distinct from sensitive (monetization vs content-warning).",
    "v0.3.0 — Sensitive content gate over media only — `contentWarnings[]` listing + keyboard-operable reveal + motion-reduce snap. `compact` prop drops heading + warnings list and shrinks to ~60px content for the small variant's 96×96 thumb.",
    "v0.3.0 — Quoted article mini-card (medium + list variants) — renders inner `<ContentCardNews01 variant=\"small\">` with all gates suppressed (paywall/sensitive/badges/engagement) for a clean citation preview. Recursion-strip helper prevents infinite nesting.",
    "v0.3.0 — Light engagement counts row: like/comment/bookmark/share chips with handler-driven interactivity + bistate fill",
    "v0.3.0 — `renderEngagementCounts` slot lets consumers compose `<EngagementBar01>` on detail pages (engagement-bar-01 NOT a peer dep)",
    "v0.3.0 — Structured `NewsAuthorByline` with avatar + role + verified tick, soft-compat fallback to string `author`",
    "v0.3.0 — `NewsPublisherRow` standalone publisher chip with logo + name + click handler",
    // v0.3 — slots + opt-outs + sub-exports
    "v0.3.0 — 9 render slots: renderBadges / renderAuthor / renderExcerpt / renderPaywallGate / renderSensitiveGate / renderQuoted / renderEngagementCounts / kebabActions / moderatorActions",
    "v0.3.0 — 7 opt-outs: disableBadgesRender / disableAuthorRender / disableExcerptRender / disablePaywallGate / disableSensitiveGate / disableQuotedRender / disableEngagementCounts",
    "v0.3.0 — 11 sub-exports: NewsBadges / StatusBadge / VisibilityBadge / SponsorBadge / LiveUpdateLine / NewsAuthorByline / NewsPublisherRow / NewsPaywallGate / ContentSensitiveGate / QuotedArticleCard / NewsEngagementCounts + NewsKebab",
    // v0.3 — click handlers + handle
    "v0.3.0 — 10 per-entity click handlers: onAuthorClick / onPublisherClick / onCategoryClick / onTopicClick / onTagClick / onQuotedClick / onCommentCountClick / onTranslate / onRevealPaywall / onRevealSensitive",
    "v0.3.0 — 11-method imperative handle: openKebab / triggerEdit / triggerDelete / triggerPublish / triggerUnpublish / triggerPin / triggerFeature / revealPaywall / revealSensitive / reset(next) / getCurrentItem",
    "v0.3.0 — Local-mirror state for `paywallRevealed` + `sensitiveRevealed` flags; cleared on `reset(next)`",
    // v0.3 — labels + i18n
    "v0.3.0 — ~50 i18n label keys covering kebab / visibility / status / editorial badges / paywall / sensitive / engagement / live",
    // v0.3 — pickers
    "v0.3.0 — Library does NOT ship visibility / category / schedule pickers — single-trigger callbacks let host open its own UI",
    // a11y + carries
    "WCAG 2.5.5 — all interactive elements ≥44×44 (kebab triggers, engagement chips, paywall CTA, sensitive reveal)",
    "motion-safe: prefix on all transitions; reduced-motion users see static cards + snap-reveal gates",
    "Focus-visible ring covers full card via :has(a:focus-visible); kebab + sub-buttons own focus rings",
    "F-S1 lock — RELATIVE cross-procomp imports (CommentMenuItem via ../comment-thread-01/types)",
    "F-cross-13 defensive — DropdownMenuTrigger as the trigger button directly (no asChild)",
    "RTL aware — chevron + arrow icons flip via rtl:rotate-180",
    "React.memo wrapped — stable item refs prevent re-renders in long feeds",
  ],
  tags: [
    "content-card-news-01",
    "data",
    "card",
    "news",
    "editorial",
    "magazine",
    "migration",
    "tier-2",
    "composite",
    "role-aware",
    "permissions",
    "paywall",
    "kebab",
    "engagement-counts",
    "editor-mode",
  ],

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-05-01",
  updatedAt: "2026-06-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge", "dropdown-menu"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: ["comment-thread-01"],
  },

  related: [
    "data-table",
    "rich-card",
    "post-card-01",
    "engagement-bar-01",
    "comment-thread-01",
    "page-hero-news-01",
    "grid-layout-news-01",
  ],
};

import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "engagement-bar-01",
  name: "Engagement Bar 01",
  category: "data",

  description:
    "Discriminated-union action row (like / comment / share / bookmark / view-count / custom / reaction) with realtime subscribe contract, CSS-keyframe heart-burst sibling sub-export, slot-based likers + reactors previews, FB-style multi-kind reaction picker with long-press, and split icon-vs-count tap targets via `like.onCountClick` / `reaction.onCountClick`. No framer-motion.",
  context:
    "Highest-leverage primitive in the social-posts-system arc. Three variants: default (post body), compact (news/event card retrofits), stacked (TikTok/Reels overlay). Per-action controlled vs uncontrolled mode (controlled props win per-render). subscribe contract is the same Subscribe<EngagementDelta> shape comment-thread-01 will use. Heart-burst is a sibling RSC-compatible sub-export — retrofit consumers that don't import it pay zero animation cost. Migration origin: kasder kas-social-front-v0 PostEngagementPanel.tsx (468 LOC); we extract only the action-row concern, decomposing comments → comment-thread-01 (next ship) and likers carousel → likersPreview slot. Fourth ship in the 8-component social-posts-system arc.",
  features: [
    "Discriminated actions[] — like / comment / share / bookmark / view-count / custom / reaction — order preserved",
    "Split heart-vs-count tap targets via `like.onCountClick` — heart fires onToggle, count fires onCountClick (kasder UX). Backwards-compatible: omit onCountClick for the bundled-button behavior.",
    "Three variants — default / compact / stacked (vertical for video overlays)",
    "Per-action controlled vs uncontrolled mode (hybrid; controlled props win per-render)",
    "Realtime via Subscribe<EngagementDelta> contract — host owns transport",
    "onSubscribeDelta callback — fires for every delta regardless of mode",
    "Built-in optimistic state via engagementReducer (public export)",
    "Heart-burst as sibling RSC sub-export — CSS-keyframe-driven, zero framer-motion",
    "Sibling .css file via shadcn registry:file (first-of-kind precedent in pro-ui)",
    "Likers preview as ReactNode slot — host wires avatar pile / popover / etc.",
    "Imperative ref handle — triggerLike / triggerBookmark / triggerReaction / getCurrentState / getCurrentReaction / reset",
    "formatEngagementCount helper — humanizes (1.2k / 12k / 1.2m / 1.2b)",
    "labels.formatCount escape hatch for locale-specific count formatting",
    "Default align rule — bookmark + view-count right; per-action align? override",
    "Stacked variant ignores align — single vertical column",
    "a11y — aria-pressed for like/bookmark; group role for view-count; aria-live counts",
    "i18n via 12-key labels object with English defaults (incl. `openLikersPanel` / `openReactionsPanel` for the split count buttons' aria-labels + `react` / `removeReaction` / `reactionPickerLabel` for the reaction picker)",
    "React.memo per action part + at root — cheap re-renders",
    "Subscription effect uses controlledRef pattern — re-runs only on subscribe identity change",
    "LikersStrip sub-export — horizontal swipable avatar strip + +N pill (touch swipe + desktop drag-to-scroll). v0.2.0",
    "ShareMenu sub-export — searchable user picker (sync filter + optional async onSearch). v0.2.0",
    "Reaction kind — FB/LinkedIn-style multi-kind reactions with single `kinds` catalog (key/icon/label/count/color), pop-out picker, 350ms long-press, configurable `clearOnTap`, hybrid-with-like coexistence. v0.3.0",
    "ReactionPicker sub-export — kinds-row content + Remove button + arrow-key nav; parent owns the popover. v0.3.0",
    "ReactionAction sub-export — full popover assembly with tap-vs-long-press matrix + Defense 1 microtask defer. v0.3.0",
    "reactionsPreview slot — parallel to likersPreview; renders below the action row in all 3 variants. v0.3.0",
    "Defense 2 (structural resync guard) — internal viewerReaction syncs to controlled prop changes, prevents stale state across mode transitions. v0.3.0",
  ],
  tags: [
    "engagement-bar-01",
    "social",
    "engagement",
    "like",
    "comment",
    "share",
    "bookmark",
    "realtime",
    "heart-burst",
    "likers",
    "reactions",
  ],

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-28",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["avatar", "button", "input", "popover"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: [
    "expandable-text-01",
    "video-player-01",
    "media-carousel-01",
    "content-card-news-01",
    "event-card-01",
    "comment-thread-01",
    "post-card-01",
  ],
};

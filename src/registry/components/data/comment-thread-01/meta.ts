import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "comment-thread-01",
  name: "Comment Thread 01",
  category: "data",

  description:
    "Recursive comment tree with composer + realtime. Composes expandable-text-01 (long bodies) + engagement-bar-01 compact (per-row like). Inline-expand past maxDepth, optimistic add/like/delete, autosize composer with keyboard ergonomics.",
  context:
    "Fifth ship in the 8-component social-posts-system arc and the second cross-folder import in pro-ui (after media-carousel-01 → video-player-01). Component is always-uncontrolled — `comments` prop is initial state on mount only; subsequent prop changes are IGNORED. Use the imperative handle's `reset(next)` or `dispatch(action)` to push external updates. Realtime via Subscribe<CommentDelta> matches engagement-bar-01's shape one-to-one (single mental model). Per-row engagement-bar-01 is always controlled by the thread reducer to keep state coherent under realtime + optimistic flow. No framer-motion, no react-textarea-autosize peer dep, no date-fns peer dep. Migration origin: kasder kas-social-front-v0 PostEngagementPanel.tsx (468 LOC), CommentItem sub-component lines 413–467.",
  features: [
    "Recursive Comment[] with optional `replies?` per node — depth-aware indentation",
    "maxDepth default 2; past it, inline-expand 'view N replies' (slot-overridable)",
    "Autosize composer (roll-our-own ~25-LOC hook; no react-textarea-autosize)",
    "Keyboard ergonomics — Enter submits, Shift+Enter newline, Escape cancels",
    "Optimistic add (head insertion top-level; tail insertion replies)",
    "Optimistic like flip via thread reducer (per-row engagement-bar-01 always-controlled)",
    "Optimistic delete + revert via host's comments prop or realtime delta",
    "Realtime via Subscribe<CommentDelta> — added / edited / removed / liked",
    "onSubscribeDelta callback fires for every delta regardless of mode",
    "Pagination — onLoadMore(page) appends; pageSize default 10",
    "Inline reply composer per row (kasder UX); single composer in DOM at a time",
    "Default kebab — Delete (own only) + Report (when wired); commentActions slot for full takeover",
    "renderNode / renderViewReplies / renderComposer full-takeover slots",
    "composerEmptyState slot for sign-in CTA when currentUser absent",
    "Imperative handle — focusComposer / openReply / getCurrentComments / reset / dispatch",
    "commentReducer + useCommentState publicly exported (external state coordination)",
    "useAutosizeTextarea publicly exported (composer behaviour without the thread)",
    "CommentComposer publicly exported standalone (article-page hero CTAs)",
    "i18n via 12-key labels object with English defaults",
    "a11y — role=article + aria-labelledby; aria-pressed on like; useId() per node",
    "Touch-friendly kebab via pointer-coarse:opacity-100 (Tailwind v4)",
  ],
  tags: [
    "comment-thread-01",
    "social",
    "comments",
    "thread",
    "realtime",
    "composer",
    "recursive",
    "expandable",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["avatar", "button", "dropdown-menu", "textarea"],
    npm: {
      "lucide-react": "^0.x",
    },
    internal: ["expandable-text-01", "engagement-bar-01"],
  },

  related: [
    "expandable-text-01",
    "engagement-bar-01",
    "video-player-01",
    "media-carousel-01",
    "post-card-01",
  ],
};

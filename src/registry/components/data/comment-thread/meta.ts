import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "comment-thread",
  name: "Comment Thread",
  category: "data",

  description:
    "Recursive comment thread with composer, optimistic add, like, and delete, inline expansion past max depth, and realtime subscription hooks.",
  context:
    "Fifth ship in the 8-component social-posts-system arc and the second cross-folder import in pro-ui (after media-carousel → video-player). Component is always-uncontrolled — `comments` prop is initial state on mount only; subsequent prop changes are IGNORED. Use the imperative handle's `reset(next)` or `dispatch(action)` to push external updates. Realtime via Subscribe<CommentDelta> matches engagement-bar's shape one-to-one (single mental model). Per-row engagement-bar is always controlled by the thread reducer to keep state coherent under realtime + optimistic flow. No framer-motion, no react-textarea-autosize peer dep, no date-fns peer dep. Migration origin: kasder kas-social-front-v0 PostEngagementPanel.tsx (468 LOC), CommentItem sub-component lines 413–467.",
  features: [
    "Recursive Comment[] with optional `replies?` per node — depth-aware indentation",
    "maxDepth default 2; past it, inline-expand 'view N replies' (slot-overridable)",
    "Autosize composer (roll-our-own ~25-LOC hook; no react-textarea-autosize)",
    "Keyboard ergonomics — Enter submits, Shift+Enter newline, Escape cancels",
    "Optimistic add (head insertion top-level; tail insertion replies)",
    "Optimistic like flip via thread reducer (per-row engagement-bar always-controlled)",
    "Optimistic delete + revert via host's comments prop or realtime delta",
    "Realtime via Subscribe<CommentDelta> — added / edited / removed / liked",
    "onSubscribeDelta callback fires for every delta regardless of mode",
    "v0.2.0 — `Comment.edited` first-paint flag + `(edited)` suffix render after timestamp; realtime `{ kind: \"edited\" }` delta also flips `edited:true` so first-paint and post-edit UI behave identically",
    "v0.2.0 — `CommentMenuItem.separatorBefore` opt-in divider above any kebab item (used by post-card's moderator section; reusable for host-grouped kebabs)",
    "v0.2.1 — F-cross-13 + F-S1 cleanup: `<CommentKebab>` drops `<Button asChild>` wrapper (shadcn CLI rewrites `asChild` to `render={…}` at install-time which breaks consumers on Radix); render trigger directly as `<button>` via `buttonVariants(…)`. Cross-procomp imports in `comment-node.tsx` converted to relative + specific-file paths. Zero public-API change.",
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
    "comment-thread",
    "social",
    "comments",
    "thread",
    "realtime",
    "composer",
    "recursive",
    "expandable",
  ],

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["avatar", "button", "dropdown-menu", "textarea"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: ["expandable-text", "engagement-bar"],
  },

  related: [
    "expandable-text",
    "engagement-bar",
    "video-player",
    "media-carousel",
    "post-card",
  ],
};

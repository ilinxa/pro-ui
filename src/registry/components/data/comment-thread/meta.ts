import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "comment-thread",
  name: "Comment Thread",
  category: "data",

  description:
    "Recursive comment thread with composer, optimistic add, like, and delete, inline expansion past max depth, and realtime subscription hooks.",
  context:
    "Fifth ship in the social-posts-system arc. Since 0.4.0 the thread closes under the consumer contract: `comments` is read once at mount unless `onCommentsChange` is passed, which makes it controlled (pending operations show as an overlay over the prop; accepted changes are reported, not applied). Realtime via Subscribe<CommentDelta> is idempotent (id first, then `clientId`). Moderation (inline edit, tombstones, pin marker) is the opt-in feature item `comment-thread-moderation`, wired through the `moderation` prop; the base never imports it. Per-row engagement-bar is controlled by the thread state. No framer-motion, no textarea-autosize dep, no date-fns dep. Migration origin: kasder kas-social-front-v0 PostEngagementPanel.tsx.",
  features: [
    "v0.6.0 — compound parts: `CommentThreadRoot` (all state, the handle) with `CommentThreadList`, `CommentThreadLoadMore`, `CommentThreadComposer`, `CommentThreadScrollArea` and `useCommentThread()`; `CommentThread` is now Root + List + LoadMore + Composer with the same layout. Hand-assemble a height-capped panel with the composer below the scroll, or a list with no composer (which leaves the composer code out)",
    "v0.6.0 — `CommentThreadLoadMore mode=\"auto\"`: the next page loads as the button nears the visible edge of the enclosing scroll area (or `scrollRoot`, or the viewport), one request at a time, no automatic retry after a failure, a polite status, the button kept for keyboard users",
    "v0.6.0 — `CommentThreadScrollArea`: a focusable, named scroll region (`labels.commentsRegion`), usable around any thread",
    "v0.6.0 — `confirmDelete`: ask before a delete from the row's menu, with the `comment-thread-confirm-delete` add-on's dialog (`labels.deleteTitle` / `deleteBody(hasReplies)` / `deleteConfirm` / `deleteCancel`) or your own function; Cancel returns focus to the row's menu trigger, a confirmed delete to the neighbouring row; `helpers.onDelete` in every helper bag and `handle.deleteComment(id)` (no confirmation) delete through the built-in path",
    "v0.6.0 — `size=\"touch\"`: every control (row engagement bars, Reply, the actions menu trigger, the author-name link, Show more, View replies, Load more, the composers' buttons) has a hit area of at least 44 × 44 px; `CommentComposer` takes `size` too",
    "v0.6.0 — fixes: when the last page arrives and \"Load older comments\" goes away, focus moves to the first new comment also when a controlled host applies the page late; the \"(edited)\" suffix meets 4.5:1 contrast in light mode",
    "v0.5.0 — `renderContent(comment, { depth })`: your own links / mentions / hashtags inside the row's clamped body (Show more still works); the edit composer still edits the raw `content`",
    "v0.5.0 — labels reach every row: `labels.showMore` / `showLess`, and `labels.engagement` (all engagement-bar labels: comment, share, bookmark, view count, reaction picker); the thread's `like` / `unlike` win over `engagement.like` / `unlike`; avatar initials follow `locale`",
    "v0.5.0 — author links: `getAuthorHref(author, comment)` + `linkComponent`; the avatar link is hidden from assistive technology and the tab order, the name link is the one announced; name in `<bdi>`, `@handle` `dir=\"ltr\"`",
    "v0.5.0 — `closed` + `labels.closed`: no composer (a notice instead; `renderComposer` is not called), no Reply, open reply composers close, `handle.openReply` / `focusComposer` do nothing (one development warning); likes and menus unchanged",
    "v0.5.0 — fix: the \"View replies\" link reports its real `aria-expanded` and sets `aria-controls` only while the list it controls is in the DOM",
    "v0.4.0 — controlled `comments` + `onCommentsChange(next, change)`: the prop wins on every render, pending operations show over it, accepted changes are reported once accepted",
    "v0.4.0 — idempotent realtime: an `added` delta for an id already shown never duplicates, and `clientId` (sent through `onAddComment(content, parentId, { clientId })`) reconciles your own echo with the pending comment",
    "v0.4.0 — rollback: a failed post removes the pending comment and keeps the text (`labels.postFailed`); like, reaction, delete and edit roll back when their promise rejects; latest request wins; `optimistic`, `onError`; no unhandled rejections",
    "v0.4.0 — pending comments cannot be liked, replied to or deleted, so a temporary id never reaches your server",
    "v0.4.0 — cursor paging (`onLoadMoreCursor`, `hasMore`, `nextCursor`) beside `onLoadMore(page)`; Retry on failure; replies loaded on demand (`onLoadReplies`, `replyCount`, `repliesCursor`)",
    "v0.4.0 — per-comment `permissions`, `extraActions` appended to the defaults, `hidden` / `separatorBefore` menu items; Report no longer shows on your own comments",
    "v0.4.0 — reactions per row (`reactionKinds` + `onReactComment`, `Comment.reactions`) or your own row actions (`engagementActions`); `likes: null` withholds a count",
    "v0.4.0 — every string is a label (`kebabAriaLabel(name)`, `replyTo(name)`, …); `locale`, `timeZone`, `now`, `formatRelativeTime`, `formatCount`; relative time renders only after mount, so the server and the first client render agree; indentation mirrors in RTL",
    "v0.4.0 — moderation add-on `comment-thread-moderation` (inline edit, tombstones that keep replies, pinned marker) through the `moderation` prop; `removedMode=\"tombstone\"`",
    "v0.3.1 — the `renderComposer` slot now receives real helpers: `setValue` / `submit` / `cancel` were empty-bodied stubs, so a custom composer could not set a value, send, or clear",
    "Recursive Comment[] with optional `replies?` per node — depth-aware indentation",
    "maxDepth default 2; past it, inline-expand 'view N replies' (slot-overridable)",
    "Autosize composer (roll-our-own ~25-LOC hook; no react-textarea-autosize)",
    "Keyboard ergonomics — Enter submits, Shift+Enter newline, Escape cancels",
    "Optimistic add (head insertion top-level; tail insertion replies)",
    "Optimistic like flip via thread reducer (per-row engagement-bar always-controlled)",
    "Optimistic delete; a rejected promise restores the comment at its position",
    "Realtime via Subscribe<CommentDelta> — added / edited / removed / liked / state / reacted",
    "onSubscribeDelta callback fires for every delta regardless of mode",
    "v0.2.0 — `Comment.edited` first-paint flag + `(edited)` suffix render after timestamp; realtime `{ kind: \"edited\" }` delta also flips `edited:true` so first-paint and post-edit UI behave identically",
    "v0.2.0 — `CommentMenuItem.separatorBefore` opt-in divider above any kebab item (used by post-card's moderator section; reusable for host-grouped kebabs)",
    "v0.2.1 — F-cross-13 + F-S1 cleanup: `<CommentKebab>` drops `<Button asChild>` wrapper (shadcn CLI rewrites `asChild` to `render={…}` at install-time which breaks consumers on Radix); render trigger directly as `<button>` via `buttonVariants(…)`. Cross-procomp imports in `comment-node.tsx` converted to relative + specific-file paths. Zero public-API change.",
    "Pagination — onLoadMore(page) appends; pageSize default 10",
    "Inline reply composer per row (kasder UX); single composer in DOM at a time",
    "Default kebab from per-comment permissions — Delete (own), Report (others', when wired), Edit (with the moderation add-on); `extraActions` appends, `commentActions` takes over",
    "renderNode / renderViewReplies / renderComposer full-takeover slots",
    "composerEmptyState slot for sign-in CTA when currentUser absent",
    "Imperative handle — focusComposer / openReply / getCurrentComments / reset / dispatch",
    "commentReducer + useCommentState publicly exported (external state coordination)",
    "useAutosizeTextarea publicly exported (composer behaviour without the thread)",
    "CommentComposer publicly exported standalone (article-page hero CTAs)",
    "i18n via a typed labels object with English defaults (`defaultCommentThreadLabels`)",
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

  version: "0.6.0",
  status: "alpha",
  // 0.4.0: 75 KB was the U1 estimate; the built artifact is ~135 KB (~15 KB of it is JSDoc in
  // types.ts). Runtime cost of <CommentThread>, minified + gzip: 5.1 KB (0.3.2) → 11.6 KB.
  artifactBudgetKB: 185,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-28",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["avatar", "button", "dropdown-menu", "textarea"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: ["expandable-text", "engagement-bar"],
  },

  slices: [
    {
      name: "moderation",
      item: "comment-thread-moderation",
      description:
        "Inline edit, tombstones that keep replies, and a pinned marker, wired in through the moderation prop.",
    },
  ],

  related: [
    "expandable-text",
    "engagement-bar",
    "video-player",
    "media-carousel",
    "post-card",
  ],
};

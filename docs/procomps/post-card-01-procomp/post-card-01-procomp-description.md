# post-card-01 — procomp description

> Stage 1: what & why. **Tier-2 composite.**
>
> ### v0.1.1 patch (2026-05-03)
>
> - **Inline engagement panels are now the default.** `engagementMode` defaults to `"inline"` (was `"navigate"`). Tap-to-open panels work on every variant except `detail`. Pass `engagementMode="navigate"` to opt out.
> - **Three inline panels:** likers (horizontal swipable avatar strip + `+N` pill), comments (embedded `<CommentThread01>` with composer), share (searchable user list).
> - **Split heart-vs-count tap targets** — wired via `engagement-bar-01`'s new `like.onCountClick` action prop. Heart toggles like; count toggles likers panel. Lives at the bar level (works anywhere the bar renders); post-card-01 supplies the count callback under inline mode.
> - **New parts:** `<LikersStrip>` (touch-swipe + desktop drag-to-scroll, symmetric column grid) + `<ShareMenu>` (search input + scrollable user list).
> - **List variant image** stretches to full card height (was 96px square).
> - **Media carousel** matches kasder's slide layout exactly (mx-1 gutters + edge padding only when `loop=false`); inactive neighbors get `scale-95 opacity-60 blur-[1px]`; gallery variant gets soft edge gradients.
> - **Video URLs** — same demo videos kasder uses (w3schools `mov_bbb.mp4` / `movie.mp4`).
> - **New props:** `engagementMode` / `likers` / `onLoadMoreLikers` / `shareSuggestions` / `onShareSearch` / `onShareTo` / `inlineCommentsMaxHeight` / `defaultInlinePanel` / `openLikersOnLike` / `disableHeartBurst` / `onCopyLink` / `onReport`. **New labels:** `likersHeading` / `likersMoreLabel` / `hidePanelLabel` / `shareHeading` / `shareSearchPlaceholder` / `shareEmptyLabel`. **New types:** `PostLikeUser` / `EngagementMode`.
> - **New shadcn deps:** `input` + `popover` (already installed in the project).
>
> Sections below are the original Stage-1 spec; treat them as the historical record. Live API surface is in [`types.ts`](../../../src/registry/components/data/post-card-01/types.ts) + the [guide](./post-card-01-procomp-guide.md).
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — kasder `AdvancedPostCard.tsx` (167 LOC) — the assembly node that composes `PostContent` + `PostMediaCarousel` + `PostEngagementPanel`.
>
> **Sixth of 8** in the social-posts-system arc. **Pure composition** — 95% of the work is wiring the five already-shipped Tier-1 primitives ([`expandable-text-01`](../expandable-text-01-procomp/), [`video-player-01`](../video-player-01-procomp/), [`media-carousel-01`](../media-carousel-01-procomp/), [`engagement-bar-01`](../engagement-bar-01-procomp/), [`comment-thread-01`](../comment-thread-01-procomp/)) into one cohesive card surface. Net-new code is the variant dispatcher + post header + `Post` data shape + a few connective slots.
>
> Cross-folder dependencies declared via `registryDependencies`: all five siblings auto-pull on consumer install. Third cross-folder precedent in pro-ui after media-carousel-01 → video-player-01 and comment-thread-01 → expandable-text-01 + engagement-bar-01.

## Problem

Every social product needs a post surface that's the same compositional shape across the app: header (avatar + name + timestamp + kebab) → optional content body → optional media carousel → engagement row → optional comment thread. Built ad-hoc per consumer, this turns into the 167-LOC kasder pattern repeated for every feed / detail page / sidebar / list view, with each instance reinventing:

- The dispatch between feed-shape vs detail-shape vs sidebar-compact vs admin-list layouts
- The wiring of optimistic like flow to the heart-burst overlay (5 lines of `useState` + `setBurstKey(k+1)` + `barRef.current?.triggerLike()` pasted into every consumer)
- The `Post` data contract — every team's API returns slightly different shapes; each consumer adapts in the JSX
- Verified-badge rendering (inline SVG copy-pasted from kasder)
- Default kebab items (Bookmark / Share / Copy link / Report) — every team rebuilds Tier-1 dropdowns
- Default engagement actions array `[like, comment, share, bookmark]` — discriminated at the consumer site instead of reused
- Forwarding `currentUser` / `subscribe` / `commentActions` down through 3 children consistently

`post-card-01` is the answer: a single sealed composite that dispatches across 4 variants (`feed` / `compact` / `list` / `detail`), wires the heart-burst flow automatically, defaults sensible kebab + engagement actions, and exposes one `Post` data contract that maps cleanly to typical backend shapes — with full slot-based escape hatches at every connective seam.

## In scope

### The `Post` data contract

```ts
export interface PostAuthor {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;                          // plain text; rich content uses renderContent slot
  media?: MediaItem[];                      // empty/undefined → text-only mode (no carousel)
  createdAt: Date | string | number;        // same coercion as event-card-01

  likes: number;
  isLiked?: boolean;
  comments: number;                         // count only; the thread is owned by detail variant
  shares?: number;                          // optional — share action with no count if undefined
  viewCount?: number;                       // opt-in display
  isBookmarked?: boolean;
}
```

**Note** (R-D-1): the pre-loaded comment tree and pagination size live as **separate card props** (`commentThread?: Comment[]` + `commentPageSize?: number`), NOT on the `Post` shape. Posts and comment trees are typically separate API endpoints; mirroring `comment-thread-01`'s `comments: Comment[]` interface keeps the contract clean.

`MediaItem` re-exported from `media-carousel-01`. `Comment` re-exported from `comment-thread-01`. No re-derivation, no shape drift.

### Four variants (required `variant` prop)

| Variant | Use case | Layout shape | Engagement bar | Comment thread |
|---|---|---|---|---|
| `feed` | Default Instagram-post — feed scroll | header → content (clamped 3) → media carousel (gallery) → engagement bar (default) | `[like, comment, share, bookmark]` | NOT embedded — `comment.onClick` hands off to host |
| `compact` | Sidebar widget / discovery rail | header (small) → content (clamped 2) → media thumbnail (single, no carousel) → engagement bar (compact, like+comment only) | `[like, comment]` compact | NOT embedded |
| `list` | Admin / search results | left column thumbnail (square) + right column header + content (clamped 2) + tiny meta row | none by default; engagement is just counts | NOT embedded |
| `detail` | Full-page post detail | header → content (no clamp) → media carousel (full-width gallery) → engagement bar (default) → **`<CommentThread01>` inline** | `[like, comment, share, bookmark, view-count]` | EMBEDDED — `commentThread` from props |

`variant` is **required** (no default) — each variant is structurally different enough that a default would be misleading. Lock follows analysis.md.

### Heart-burst integration (auto-wired for feed + detail when media present)

The canonical Instagram flow (double-tap media → like flips + heart-burst overlays):

```
post.media[] present + onLike wired:
  → post-card-01 owns burstKey + barRef
  → media-carousel-01.onDoubleTap = () => { barRef.triggerLike(); setBurstKey(k+1) }
  → renders <EngagementHeartBurst trigger={burstKey}> absolutely-positioned over the carousel container
```

When `post.media` is empty or `onLike` is absent, no burst is wired — the card stays minimal. Hosts wanting to suppress the burst even with media + onLike pass `disableHeartBurst: true`.

In `compact` and `list` variants, the heart-burst is NOT wired (visual context too tight).

### Default engagement actions builder

```ts
/** Engagement-action handlers only — comment-related handlers stay separate. */
export interface PostHandlers {
  onLike?: (postId: string, nextLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string, nextBookmarked: boolean) => void;
}

export function defaultPostEngagementActions(
  post: Post,
  handlers: PostHandlers,
  variant: PostCard01Variant,
): EngagementAction[];
```

Exported helper. Returns the canonical `[like, comment, share, bookmark]` (or `[like, comment, share, bookmark, view-count]` for detail) discriminated array based on the `Post` shape + handlers wired. Hosts that want to **extend** rather than replace use it as a base:

```tsx
engagementActions={(post, handlers) => [
  ...defaultPostEngagementActions(post, handlers),
  { kind: "custom", id: "remix", label: "Remix", icon: <Wand2 />, onClick: () => openRemix(post.id) },
]}
```

`engagementActions?: (post, handlers) => EngagementAction[]` is the prop slot for full takeover. Defaults applied if absent.

### Default header kebab actions

Default items: **Bookmark / Unbookmark** (toggle, fires `onBookmark`) → **Share** (fires `onShare`) → **Copy link** (calls `getHref?(post)` → writes to clipboard via `navigator.clipboard.writeText`; hidden if no `getHref`) → separator → **Report** (fires `onReport`).

Hosts wanting to override entirely:

```tsx
kebabActions={(post) => [
  { label: "Pin to top", onClick: () => api.pin(post.id) },
  { label: "Translate", onClick: () => api.translate(post.id) },
  { label: "Block author", onClick: () => api.block(post.author.id) },
  { label: "Report", destructive: true, onClick: () => openReport(post.id) },
]}
```

Returning `[]` hides the kebab. Same `CommentMenuItem`-style data shape from comment-thread-01.

### Verified badge

Sealed `<VerifiedBadge>` part — inline SVG (kasder's pattern). RSC-compatible, no `"use client"`. Renders next to the author name when `post.author.isVerified === true`. `aria-label="Verified account"` (configurable via `labels.verifiedBadgeLabel`).

### Realtime subscriptions (two separate)

Locked design: **two separate subscribe props, not a unified delta union**.

```ts
engagementSubscribe?: Subscribe<EngagementDelta>;     // forwarded to engagement-bar-01
commentSubscribe?: Subscribe<CommentDelta>;           // forwarded to comment-thread-01 (detail only)
```

Why two: the delta shapes are already distinct types in their respective components; merging into a discriminated union here would force every consumer to learn a third union. Two separate channels = each component sees its own canonical contract.

`onSubscribeEngagementDelta?` + `onSubscribeCommentDelta?` callbacks for analytics / cross-component coordination.

### `currentUser` forwarding

Single `currentUser?: { id; name; avatar? }` prop on the card. Forwarded to:
- The engagement bar (no — engagement-bar-01 doesn't take `currentUser`; only host wires `onToggle`)
- The comment thread (yes — drives composer avatar + "isOwn" check on the kebab; same shape `comment-thread-01` already accepts)

### Slots / render-prop escape hatches

- `renderHeader?: (post, helpers) => ReactNode` — full takeover for the header row. Helpers carry `{ currentUser }`.
- `renderContent?: (post) => ReactNode` — full takeover for the body block. Default is `<ExpandableText01 content={post.content} maxLines={...}>`. Override use case: rich Plate-rendered content in `detail` variant.
- `renderMedia?: (media, slotHelpers) => ReactNode` — full takeover for the carousel. `slotHelpers` carries `{ onDoubleTap, isCardFocused }` so consumers replacing media can still wire heart-burst.
- `engagementActions?: (post, handlers) => EngagementAction[]` — full takeover for the engagement actions array. `defaultPostEngagementActions(post, handlers)` is the export for "extend, not replace."
- `kebabActions?: (post) => CommentMenuItem[]` — full takeover for the header kebab. `[]` hides it.
- `commentActions?: (comment, helpers) => CommentMenuItem[]` — forwarded to `<CommentThread01>` in detail variant.
- `renderEngagementBar?: (post, defaults) => ReactNode` — full takeover for the entire engagement row (rare; for hosts with totally custom engagement UI). Default builds `<EngagementBar01>` from `engagementActions(post, handlers)`.

### Imperative ref handle

```ts
export interface PostCard01Handle {
  /** Programmatically open the kebab menu. */
  openKebab: () => void;
  /**
   * Card-level "canonical Instagram tap" — flips like via the bar AND bumps burst counter (when wired).
   * Distinct from getEngagementHandle().triggerLike(), which only flips the bar without firing the burst.
   */
  triggerLike: () => void;
  /** Read the underlying engagement-bar-01 handle (bar-only operations). */
  getEngagementHandle: () => EngagementBar01Handle | null;
  /** Read the underlying comment-thread-01 handle (detail variant only; null otherwise). */
  getThreadHandle: () => CommentThread01Handle | null;
}
```

Two `triggerLike()` methods (R-D-3): card-level wraps bar + burst (canonical UX); engagement-handle's flips just the bar. Same name, distinct purposes — pick the one that matches your call site.

### a11y

- Card root is `<article role="article" aria-labelledby={authorId}>`.
- Author name is `id={authorId}` — single `<h3>` for feed/list/compact; `<h2>` for detail (configurable via `headingAs`).
- Verified badge has `role="img"` + `aria-label`.
- Kebab inherits Radix DropdownMenu's a11y.
- Heart-burst is `aria-hidden="true"` (decorative — like state announces via `aria-pressed` on the engagement bar's like action).
- Carousel a11y inherits from `<MediaCarousel01>`.
- Detail variant's `<h2>` is followed by `<h3>` for the comments section (default label "Comments", configurable).

### i18n labels

10-key `labels?: PostCard01Labels`:
- `verifiedBadgeLabel?: string` — default "Verified account"
- `bookmark` / `unbookmark` / `share` / `copyLink` / `report` — kebab item labels
- `commentsHeading?: string` — detail variant section heading
- `formatRelativeTime?: (date, now) => string` — same shape as comment-thread-01's `formatRelativeTime`; default delegates to `defaultRelativeTime` (re-exported from comment-thread-01)
- `engagementLabels?: EngagementBarLabels` — forwarded to engagement-bar-01
- `commentLabels?: CommentThreadLabels` — forwarded to comment-thread-01

`DEFAULT_POST_CARD_LABELS` exported.

## Out of scope (v0.2 candidates)

- **Inline edit affordance** — locked deferred for the entire arc.
- **Reaction emojis** (Facebook-style 6-emoji popover on long-press of like) — explicit out-of-scope; engagement-bar-01 v0.2 candidate.
- **Inline comment thread in `feed` variant** — only `detail` embeds the thread. Feed/compact/list rely on `comment.onClick` to hand off to host (typically navigates to detail). Hosts wanting feed-with-inline-thread compose `<CommentThread01>` themselves under the card.
- **`view-count` analytics injection** — host owns the count; we don't auto-track impressions.
- **Long-press preview** (force-touch / 3D-touch detail peek) — out of scope.
- **Link previews** in content body — host-rendered via `renderContent` slot.
- **Mention chips / hashtag highlighting** — same; `renderContent` slot.
- **Multi-author post** (collaborative posts) — `post.author` is a single object in v0.1.

## Target consumers

- **Social feed pages** — primary. Feed variant in a `<ul>` of cards.
- **Post detail pages** — detail variant + embedded thread.
- **Profile pages** — feed variant with author column hidden via `renderHeader`.
- **Sidebar discovery widgets** — compact variant.
- **Admin moderation dashboards** — list variant with custom kebab actions (block / take down / etc.).
- **`/sandbox/social-feed-page-01`** — Tier-3 composition (next after this ship).

## Rough API sketch

Minimal feed:

```tsx
<PostCard01
  variant="feed"
  post={post}
  currentUser={viewer}
  onLike={(id, liked) => api.likePost(id, liked)}
  onComment={(id) => router.push(`/posts/${id}#comments`)}
  onShare={(id) => share(id)}
  onBookmark={(id, bookmarked) => api.bookmarkPost(id, bookmarked)}
  getHref={(p) => `/posts/${p.id}`}
/>
```

Detail with embedded thread + realtime:

```tsx
const engagementSubscribe = useCallback<Subscribe<EngagementDelta>>(
  (h) => channel.on(`post-${post.id}-engagement`, h),
  [post.id, channel],
);
const commentSubscribe = useCallback<Subscribe<CommentDelta>>(
  (h) => channel.on(`post-${post.id}-comments`, h),
  [post.id, channel],
);

<PostCard01
  variant="detail"
  post={post}
  currentUser={viewer}
  engagementSubscribe={engagementSubscribe}
  commentSubscribe={commentSubscribe}
  onLike={api.likePost}
  onAddComment={(content, parentId) => api.addComment(post.id, { content, parentId })}
  onLikeComment={api.likeComment}
  onDeleteComment={api.deleteComment}
  onReportComment={openReportDialog}
  onLoadMoreComments={(page) => api.fetchComments(post.id, page)}
  commentActions={(c, { isOwn }) => [
    isOwn && { label: "Delete", destructive: true, onClick: () => api.deleteComment(c.id) },
    { label: "Report", onClick: () => openReportDialog(c.id) },
  ].filter(Boolean) as CommentMenuItem[]}
/>
```

Compact sidebar widget:

```tsx
<PostCard01
  variant="compact"
  post={post}
  onLike={api.likePost}
  onComment={(id) => router.push(`/posts/${id}#comments`)}
/>
```

Extend default engagement actions with a custom one:

```tsx
<PostCard01
  variant="feed"
  post={post}
  engagementActions={(p, h) => [
    ...defaultPostEngagementActions(p, h),
    { kind: "custom", id: "remix", label: "Remix", icon: <Wand2 />, onClick: () => openRemix(p.id) },
  ]}
/>
```

Custom kebab for moderator surfaces:

```tsx
<PostCard01
  variant="list"
  post={post}
  kebabActions={(p) => [
    { label: "Pin", onClick: () => api.pin(p.id) },
    { label: "Take down", destructive: true, onClick: () => api.takeDown(p.id) },
    { label: "Block author", onClick: () => api.block(p.author.id) },
  ]}
/>
```

## Public exports (from `index.ts`)

```ts
export { PostCard01 } from "./post-card-01";
export { VerifiedBadge } from "./parts/verified-badge";
export { defaultPostEngagementActions, defaultPostKebabActions } from "./lib/defaults";

export type {
  Post,
  PostAuthor,
  PostCard01Props,
  PostCard01Handle,
  PostCard01Variant,
  PostCard01Labels,
  PostHandlers,
} from "./types";

export { DEFAULT_POST_CARD_LABELS } from "./types";

// Re-exports for consumer convenience (so they don't need to import from sibling slugs)
export type { MediaItem } from "@/registry/components/media/media-carousel-01";
export type { Comment, CommentDelta, CommentMenuItem } from "@/registry/components/data/comment-thread-01";
export type { EngagementAction, EngagementDelta, EngagementBar01Handle } from "@/registry/components/data/engagement-bar-01";
export type { Subscribe, Unsubscribe } from "@/registry/components/data/comment-thread-01";

export { meta } from "./meta";
```

## Stage-1 locks (signed off after re-validation)

- **Q1 / variant dispatcher:** **single `<PostCard01 variant="…">`** with internal switch into `parts/<variant>-variant.tsx`. Matches `event-card-01`'s 4-variant precedent. One import, one type, one ref handle. Tree-shake cost (~3KB per unused variant) is acceptable.
- **Q2 / comment thread in detail variant:** **slot with auto-default** — card auto-renders `<CommentThread01>` for the 90% case AND exposes `renderCommentSection?(post, handlers): ReactNode` slot for full takeover. Same shape as `engagementActions` and `kebabActions`.
- **Q3 / heart-burst auto-wiring:** **heuristic** — auto-wired when `post.media?.length > 0` AND `onLike` provided AND `variant ∈ {feed, detail}`. `disableHeartBurst: true` opts out. Hosts wanting full control over burst placement use `renderMedia` slot with their own `<EngagementHeartBurst>` instance.
- **R-D-1 / `commentThread` placement:** lives as **separate card props** (`commentThread?: Comment[]` + `commentPageSize?: number`), NOT on `Post`. Mirrors `comment-thread-01`'s contract.
- **R-D-2 / `PostHandlers` shape:** typed as engagement-action handlers only (`onLike` / `onComment` / `onShare` / `onBookmark`). Comment handlers stay separate (forwarded directly to `<CommentThread01>` in detail variant).
- **R-D-3 / `triggerLike()` semantics:** card-level wraps bar + burst; engagement-handle's flips bar only. Same name, distinct purposes.
- **R-D-5 / `getHref` double-duty:** single prop drives (a) overlay-link in `feed` / `compact` / `list` variants AND (b) "Copy link" kebab item. Detail variant ignores overlay-link (destination doesn't link to itself); kebab Copy-link still works. Add `linkComponent?: ElementType` for polymorphic root.

## Pre-emptive locks (everything inherited from precedents — committed silently per memory)

- **Always-uncontrolled** with `reset(next: Post)` + `dispatch(action)` imperative escape hatches. `post` prop is initial state on mount. (Comment-thread-01 R-Plan-15 reasoning carries over — surgical updates flow through `getEngagementHandle()` / `getThreadHandle()` for the children's reducers; `reset(next)` swaps the entire post.)
- **`<PostCard01>` is `"use client"`** — owns kebab open state + burstKey + imperative handle.
- **`<VerifiedBadge>` is RSC-compatible** (no `"use client"`).
- **`React.memo` at export** + ref-as-prop (React 19 pattern; matches engagement-bar-01 / comment-thread-01).
- **Cross-folder imports allowed** — declared via `registryDependencies: ["expandable-text-01", "video-player-01", "media-carousel-01", "engagement-bar-01", "comment-thread-01"]`. Third precedent in pro-ui after media-carousel-01 → video-player-01 and comment-thread-01 → expandable-text-01 + engagement-bar-01.
- **No new shadcn primitives required** — `avatar`, `button`, `card`, `dropdown-menu` all already in `src/components/ui/`. No `pnpm dlx shadcn add` needed.
- **No framer-motion.** CSS keyframes via inherited heart-burst sibling (already handled by engagement-bar-01).
- **`Post` shape extends kasder's `AdvancedPostData`** with `replies` count + `commentThread?: Comment[]` for detail-mode pre-loading. No re-derivation of base fields.
- **`MediaItem`, `Comment`, `EngagementAction`, etc. re-imported (not re-defined)** — single source of truth; structurally compatible across the family.
- **Two separate subscribe props** (engagement + comments), not a unified union — distinct delta types stay distinct.
- **`labels` includes `engagementLabels` + `commentLabels` slots** for forwarding to children (locked per pattern with [content-card-news-01](../content-card-news-01-procomp/) which has `categoryStyles` + similar nested config).
- **Tailwind v4 translations applied at write-time:** `bg-gradient-to-X` → `bg-linear-to-X`, `break-words` → `wrap-break-word`, `grayscale-[N%]` → `grayscale-N`.
- **Locked target convention** for `registry.json`: every file `type: "registry:component"`, `target: "components/post-card-01/<sub>"`. Never ship `demo.tsx`/`usage.tsx`/`meta.ts`. `dummy-data.ts` ships only via `post-card-01-fixtures` sibling.

---

**Stage 1 signed off 2026-05-02.** All Q1–Q3 + R-D-1/2/3/5 committed inline above. Implementation gate moves to plan stage.

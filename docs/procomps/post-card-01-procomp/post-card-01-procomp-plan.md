# post-card-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> ### v0.1.1 patch (2026-05-03)
>
> The plan below is the historical Stage-2 record. v0.1.1 layered the following on top — see the [guide](./post-card-01-procomp-guide.md) for the live consumer-facing surface:
>
> - **`engagementMode` default flipped to `"inline"`.** Was `"navigate"` in v0.1. Inline panels work on every variant except `detail` (which already shows its embedded thread). Pass `engagementMode="navigate"` to deactivate.
> - **3 inline panels** (single state, one open at a time): `likes` (`<LikersStrip>`) / `comments` (`<CommentThread01>` in scroll wrapper) / `share` (`<ShareMenu>`).
> - **Heart-vs-count split** lives in `engagement-bar-01` (new `like.onCountClick` field on the action; bar renders two click targets when present). Post-card-01 supplies the count callback under inline mode via `defaultPostEngagementActions(post, handlers, variant, onLikeCountClick?)` — fourth arg.
> - **New parts** in `parts/`: `likers-strip.tsx` (with internal `useDragScroll` hook), `share-menu.tsx`.
> - **List variant** outer becomes `items-stretch` + `p-0` when there's media; thumb is `w-32 self-stretch overflow-hidden`; inner content area gets its own `p-3`.
> - **Media-carousel slide layout** matches kasder verbatim (`mx-1 flex-[0_0_85%]` + edge `marginLeft`/`marginRight` only when `!loop`); inactive neighbors get `scale-95 opacity-60 blur-[1px]`; gallery edge gradients (`bg-linear-to-r/l from-background to-transparent w-12`); defensive Embla overrides removed.
> - **`registry.json`** post-card-01 base item gains 2 new files (`parts/likers-strip.tsx` + `parts/share-menu.tsx`); shadcn deps gain `input` + `popover`.
> - **Demo** grew from 7 → 9 tabs (added Video tab + renamed Inline → Inline TR).
> - **Version bump:** v0.1.0 → v0.1.1.
>
> See [`post-card-01-procomp-description.md`](./post-card-01-procomp-description.md) for the what & why.
>
> **Migration origin:** kasder `AdvancedPostCard.tsx` (167 LOC).
>
> **Cross-folder dependencies (registry-declared — third precedent in pro-ui after media-carousel-01 → video-player-01 and comment-thread-01 → expandable-text-01 + engagement-bar-01):**
> - [`expandable-text-01`](../expandable-text-01-procomp/) — body content
> - [`media-carousel-01`](../media-carousel-01-procomp/) — media display
> - [`engagement-bar-01`](../engagement-bar-01-procomp/) + `<EngagementHeartBurst>` — actions + double-tap burst
> - [`comment-thread-01`](../comment-thread-01-procomp/) — embedded thread (detail variant only)

## Q-P locks (most carry from precedents — only novel ones re-stated)

| # | Lock | Source |
|---|---|---|
| Q-P1 | Single component `<PostCard01 variant="…">` dispatcher; per-variant parts in `parts/<variant>-variant.tsx`. | Stage-1 Q1 + event-card-01 precedent |
| Q-P2 | `renderCommentSection?(post, handlers)` slot with auto-default (`<CommentThread01>` in detail variant). | Stage-1 Q2 |
| Q-P3 | Heart-burst heuristic auto-wires when `post.media?.length > 0` AND `onLike` AND `variant ∈ {feed, detail}`. `disableHeartBurst: true` opts out. | Stage-1 Q3 |
| Q-P4 | `commentThread?: Comment[]` + `commentPageSize?: number` are card-level props, NOT on `Post`. | Stage-1 R-D-1 |
| Q-P5 | `PostHandlers` = engagement-action handlers only. | Stage-1 R-D-2 |
| Q-P6 | Card-level `triggerLike()` wraps bar + burst; engagement-handle's flips bar only. | Stage-1 R-D-3 |
| Q-P7 | Single `getHref` for overlay-link AND kebab Copy-link; detail variant ignores overlay-link. | Stage-1 R-D-5 |
| Q-P8 | Always-uncontrolled — `post` prop is initial state on mount. `reset(next: Post)` + `dispatch` imperative escape hatches mirror engagement-bar-01 + comment-thread-01 patterns. Surgical updates flow through `getEngagementHandle()` / `getThreadHandle()` for child-state mutations. | comment-thread-01 R-Plan-15 |
| Q-P9 | Two separate subscribe props (`engagementSubscribe`, `commentSubscribe`) + two callbacks. No unified delta union. | description spec |
| Q-P10 | Verified badge sealed `<VerifiedBadge>` part — RSC-compatible (no `"use client"`). | matches engagement-bar-01's `<EngagementHeartBurst>` precedent |
| Q-P11 | Per-variant parts files: `parts/feed-variant.tsx` / `compact-variant.tsx` / `list-variant.tsx` / `detail-variant.tsx`. Plus `parts/post-header.tsx` (shared by all 4) + `parts/verified-badge.tsx`. | Q-P1 corollary |
| Q-P12 | `defaultPostEngagementActions(post, handlers, variant)` exported from `lib/defaults.ts`. Variant arg drives the actions list (compact gets `[like, comment]`; detail gets `[..., view-count]`; etc.). | description spec |
| Q-P13 | `defaultPostKebabActions(post, handlers, labels)` exported same path. | description spec |
| Q-P14 | `<PostCard01>` is `"use client"` (owns kebab open state + burstKey + handle). | inherited from engagement-bar-01 |
| Q-P15 | Variant parts files are `"use client"` (each owns its own JSX wiring; consistent across the four). | Q-P14 corollary |
| Q-P16 | `React.memo` at export + ref-as-prop. | engagement-bar-01 + comment-thread-01 precedent |
| Q-P17 | No new shadcn primitives (avatar / button / card / dropdown-menu all present). | verified |
| Q-P18 | No framer-motion. CSS via inherited engagement-heart-burst sibling. | project lock |
| Q-P19 | Tailwind v4 translations applied at write-time. | project lock |
| Q-P20 | Locked target convention: `registry:component`, `target: "components/post-card-01/<sub>"`. Never ship demo/usage/meta. Fixtures via `-fixtures` sibling. | project lock |
| Q-P21 | **Local engagement mirror** in post-card-01 (initialized from `post` on mount via `useState`). Bar runs always-controlled; mirror flows through `defaultPostEngagementActions`. Resolves the always-uncontrolled ↔ engagement-bar-01-controlled-mode conflict. | R-Plan-1 |
| Q-P22 | **Wrapped `PostHandlers`** passed to `engagementActions(post, wrappedHandlers, variant)`. Wrapping dispatches mirror first, then fires host handler. Consumer-provided actions get correct behavior without knowing about the mirror. | R-Plan-2 |
| Q-P23 | **`reset(next: Post)` + `getCurrentPost()`** on `PostCard01Handle`. Required by always-uncontrolled lock. Re-derives local engagement mirror on reset. | R-Plan-3 |
| Q-P24 | **Post-card-01 owns `engagementSubscribe`** — bar doesn't receive it directly. Card subscribes, dispatches into local mirror, fires `onSubscribeEngagementDelta`. `commentSubscribe` still forwards directly to embedded `<CommentThread01>` (its internal reducer handles delta routing). | R-Plan-4 |

## Final API

### Public types

```ts
// types.ts
import type { ElementType, ReactNode } from "react";
import type { MediaItem } from "@/registry/components/media/media-carousel-01";
import type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  Subscribe,
} from "@/registry/components/data/comment-thread-01";
import type {
  EngagementAction,
  EngagementBar01Handle,
  EngagementBarLabels,
  EngagementDelta,
} from "@/registry/components/data/engagement-bar-01";
import type { CommentThread01Handle, CommentThreadLabels } from "@/registry/components/data/comment-thread-01";

export type PostCard01Variant = "feed" | "compact" | "list" | "detail";

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
  content: string;
  media?: MediaItem[];
  createdAt: Date | string | number;
  likes: number;
  isLiked?: boolean;
  comments: number;
  shares?: number;
  viewCount?: number;
  isBookmarked?: boolean;
}

export interface PostHandlers {
  onLike?: (postId: string, nextLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string, nextBookmarked: boolean) => void;
}

export interface PostCard01Labels {
  verifiedBadgeLabel?: string;
  bookmark?: string;
  unbookmark?: string;
  share?: string;
  copyLink?: string;
  report?: string;
  commentsHeading?: string;
  formatRelativeTime?: (date: Date, now: Date) => string;
  engagementLabels?: EngagementBarLabels;
  commentLabels?: CommentThreadLabels;
}

export const DEFAULT_POST_CARD_LABELS: Required<
  Omit<PostCard01Labels, "formatRelativeTime" | "engagementLabels" | "commentLabels">
> = {
  verifiedBadgeLabel: "Verified account",
  bookmark: "Bookmark",
  unbookmark: "Remove bookmark",
  share: "Share",
  copyLink: "Copy link",
  report: "Report",
  commentsHeading: "Comments",
};

export interface PostCard01Props extends PostHandlers {
  variant: PostCard01Variant;
  post: Post;
  currentUser?: CommentThreadCurrentUser;

  // ─── Pre-loaded comment thread (detail variant) ───
  commentThread?: Comment[];
  commentPageSize?: number;

  // ─── Comment-thread handlers (forwarded; detail variant only) ───
  onAddComment?: (
    content: string,
    parentId?: string,
  ) => Promise<Comment | void> | Comment | void;
  onLikeComment?: (commentId: string, nextLiked: boolean) => void;
  onDeleteComment?: (commentId: string) => void;
  onReportComment?: (commentId: string) => void;
  onLoadMoreComments?: (page: number) => Promise<Comment[]>;

  // ─── Realtime ───
  engagementSubscribe?: Subscribe<EngagementDelta>;
  commentSubscribe?: Subscribe<CommentDelta>;
  onSubscribeEngagementDelta?: (delta: EngagementDelta) => void;
  onSubscribeCommentDelta?: (delta: CommentDelta) => void;

  // ─── Linking + heart-burst ───
  /** Card overlay-link target + Copy-link kebab item. Ignored for overlay-link in detail variant. */
  getHref?: (post: Post) => string;
  /** Polymorphic root component for overlay-link (e.g. NextLink). Default "a". */
  linkComponent?: ElementType;
  /** Opt-out for the canonical heart-burst flow. Default false. */
  disableHeartBurst?: boolean;

  // ─── Slots ───
  renderHeader?: (
    post: Post,
    helpers: { currentUser?: CommentThreadCurrentUser },
  ) => ReactNode;
  renderContent?: (post: Post) => ReactNode;
  renderMedia?: (
    media: MediaItem[],
    helpers: { onDoubleTap?: () => void },
  ) => ReactNode;
  engagementActions?: (
    post: Post,
    handlers: PostHandlers,
    variant: PostCard01Variant,
  ) => EngagementAction[];
  renderEngagementBar?: (
    post: Post,
    defaults: { actions: EngagementAction[] },
  ) => ReactNode;
  kebabActions?: (post: Post) => CommentMenuItem[];
  /** Forwarded to comment-thread-01 in detail variant. */
  commentActions?: (
    comment: Comment,
    helpers: {
      currentUser?: CommentThreadCurrentUser;
      isOwn: boolean;
      depth: number;
    },
  ) => CommentMenuItem[];
  /** Override the embedded comment section in detail variant (default = <CommentThread01>). */
  renderCommentSection?: (
    post: Post,
    handlers: {
      onAddComment?: PostCard01Props["onAddComment"];
      onLikeComment?: PostCard01Props["onLikeComment"];
      onDeleteComment?: PostCard01Props["onDeleteComment"];
      onReportComment?: PostCard01Props["onReportComment"];
      onLoadMoreComments?: PostCard01Props["onLoadMoreComments"];
    },
  ) => ReactNode;

  // ─── Misc ───
  /** Heading semantic level for the author row. Default "h3" for feed/list/compact, "h2" for detail. */
  headingAs?: "h2" | "h3" | "h4";
  /** Body line clamp default by variant: feed=3, compact=2, list=2, detail=undefined (no clamp). */
  bodyMaxLines?: number;

  labels?: PostCard01Labels;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  mediaClassName?: string;
  engagementClassName?: string;
  commentSectionClassName?: string;

  ref?: React.Ref<PostCard01Handle>;
}

export interface PostCard01Handle {
  openKebab: () => void;
  /** Card-level: bar.triggerLike() + setBurstKey(k+1) when wired. */
  triggerLike: () => void;
  /** Read the current local mirror state (post + engagement deltas applied). */
  getCurrentPost: () => Post;
  /** Replace the post (re-derives local engagement mirror). */
  reset: (next: Post) => void;
  getEngagementHandle: () => EngagementBar01Handle | null;
  getThreadHandle: () => CommentThread01Handle | null;
}
```

### Default builder signatures

```ts
// lib/defaults.ts

export function defaultPostEngagementActions(
  post: Post,
  handlers: PostHandlers,
  variant: PostCard01Variant,
): EngagementAction[];

export function defaultPostKebabActions(
  post: Post,
  handlers: {
    onBookmark?: PostHandlers["onBookmark"];
    onShare?: PostHandlers["onShare"];
    onReport?: (postId: string) => void;
    onCopyLink?: (postId: string) => void;
  },
  labels: Required<
    Pick<PostCard01Labels, "bookmark" | "unbookmark" | "share" | "copyLink" | "report">
  >,
): CommentMenuItem[];
```

### Exported names

```ts
// index.ts
export { PostCard01 } from "./post-card-01";
export { VerifiedBadge } from "./parts/verified-badge";
export {
  defaultPostEngagementActions,
  defaultPostKebabActions,
} from "./lib/defaults";

export type {
  Post,
  PostAuthor,
  PostHandlers,
  PostCard01Props,
  PostCard01Handle,
  PostCard01Variant,
  PostCard01Labels,
} from "./types";
export { DEFAULT_POST_CARD_LABELS } from "./types";

// Re-exports for consumer convenience
export type { MediaItem } from "@/registry/components/media/media-carousel-01";
export type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  Subscribe,
  Unsubscribe,
} from "@/registry/components/data/comment-thread-01";
export type {
  EngagementAction,
  EngagementDelta,
  EngagementBar01Handle,
} from "@/registry/components/data/engagement-bar-01";

export { meta } from "./meta";
```

## File-by-file plan

**16 files** (1 root + 6 parts + 1 lib + 8 standard). Sealed folder.

```
src/registry/components/data/post-card-01/
├── post-card-01.tsx                # 1 — root dispatcher
├── parts/
│   ├── feed-variant.tsx            # 2 — Instagram-post shape
│   ├── compact-variant.tsx         # 3 — sidebar widget
│   ├── list-variant.tsx            # 4 — admin/search row
│   ├── detail-variant.tsx          # 5 — full-page + embedded thread
│   ├── post-header.tsx             # 6 — avatar + name + verified + timestamp + kebab (shared)
│   └── verified-badge.tsx          # 7 — inline-SVG checkmark (RSC)
├── lib/
│   └── defaults.ts                 # 8 — defaultPostEngagementActions + defaultPostKebabActions
├── types.ts                        # 9
├── dummy-data.ts                   # 10 — 8 sample posts (text-only / single-image / multi-image / video / mixed / featured / long-text / verified)
├── demo.tsx                        # 11 — 7 tabs
├── usage.tsx                       # 12
├── meta.ts                         # 13
└── index.ts                        # 14
```

(That's 14 unique files — 11 ship via the registry. `demo`/`usage`/`meta` are docs-only; `dummy-data` ships via `-fixtures` sibling.)

### 1. `post-card-01.tsx` — root dispatcher

- `"use client"`.
- `React.memo` at export, ref-as-prop.
- Resolves defaults: `headingAs` per variant; `bodyMaxLines` per variant.
- Owns top-level state: `kebabOpen: boolean`, `burstKey: number`.
- Owns refs: `barRef: Ref<EngagementBar01Handle>`, `threadRef: Ref<CommentThread01Handle>` (detail only).
- Computes `heartBurstWired = !disableHeartBurst && (post.media?.length ?? 0) > 0 && !!onLike && (variant === "feed" || variant === "detail")`.
- Computes `cardLinkable = !!getHref && variant !== "detail"`.
- Builds `engagementActionsArr` via `engagementActions ?? defaultPostEngagementActions`.
- Builds `kebabItemsArr` via `kebabActions ?? defaultPostKebabActions(post, { onBookmark, onShare, onReport: ..., onCopyLink: ... }, labels)`.
- Implements `useImperativeHandle`:
  - `openKebab: () => setKebabOpen(true)`
  - `triggerLike: () => { barRef.current?.triggerLike(); if (heartBurstWired) setBurstKey(k => k+1); }`
  - `getEngagementHandle: () => barRef.current`
  - `getThreadHandle: () => threadRef.current`
- Switches on `variant` and renders `<FeedVariant>` / `<CompactVariant>` / `<ListVariant>` / `<DetailVariant>` — each receives a unified prop bundle (post + currentUser + computed defaults + handlers + slots + refs).

### 2. `parts/feed-variant.tsx` — Instagram-post shape

- `"use client"`.
- Layout: `<article role="article" aria-labelledby={authorId}>` outer.
- Optional overlay `<linkComponent href={getHref(post)} aria-label={post.content.slice(0,80)} className="absolute inset-0 z-0">` covers the article surface (only when `cardLinkable === true`).
- Header (renders `<PostHeader>` part) at `relative z-10`.
- Body via `renderContent ?? <ExpandableText01 content={post.content} maxLines={bodyMaxLines}>` — `relative z-10`.
- Media block: `relative` container.
  - `renderMedia ?? <MediaCarousel01 items={post.media} variant="gallery" onDoubleTap={...}>`.
  - When `heartBurstWired`: `<EngagementHeartBurst trigger={burstKey} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">`.
- Engagement: `renderEngagementBar ?? <EngagementBar01 ref={barRef} actions={engagementActionsArr} subscribe={engagementSubscribe} onSubscribeDelta={onSubscribeEngagementDelta} labels={labels.engagementLabels}>` — `relative z-10`.
- No comment section.
- The `onDoubleTap` handler passed to MediaCarousel01: `() => { barRef.current?.triggerLike(); setBurstKey(k => k+1); }` — but `setBurstKey` is owned by root. Pass `triggerLikeWithBurst` callback down from root to variant.

### 3. `parts/compact-variant.tsx` — sidebar widget

- `"use client"`.
- Tighter padding, smaller avatar (`h-8 w-8`).
- Header inline (no kebab visible by default; available via tap on parent).
- Body via `<ExpandableText01 content={post.content} maxLines={2}>`.
- If `post.media?.length > 0`: render single thumbnail `<img>` (first item only) at `aspect-square` `w-16 h-16` shrink-0 next to body. NO carousel, NO heart-burst.
- Engagement: `<EngagementBar01 variant="compact" actions={[like, comment-only]}>`.
- Optional overlay-link covers the whole compact card.

### 4. `parts/list-variant.tsx` — admin/search row

- `"use client"`.
- Layout: `flex` row. Left: square thumb (first media item) `w-24 h-24`. Right: header + content (clamp 2) + tiny meta row (counts only, no interactive engagement bar).
- No interactive engagement actions by default — just text counts (`"42 likes · 7 comments · 3 shares"`).
- Kebab visible (admin moderators want quick access).
- Optional overlay-link covers the whole row.

### 5. `parts/detail-variant.tsx` — full page

- `"use client"`.
- Layout: header → body (no clamp) → media (full-width gallery) → engagement bar (full set) → embedded comment thread.
- NO overlay-link (Q-P7).
- Heart-burst wired same as feed variant.
- Comment section: `renderCommentSection ?? <CommentThread01 ref={threadRef} comments={commentThread ?? []} currentUser={currentUser} pageSize={commentPageSize ?? 10} subscribe={commentSubscribe} onSubscribeDelta={onSubscribeCommentDelta} onAddComment={onAddComment} onLikeComment={onLikeComment} onDeleteComment={onDeleteComment} onReportComment={onReportComment} onLoadMore={onLoadMoreComments} commentActions={commentActions} labels={labels.commentLabels}>`.
- Comments heading: `<h3>{labels.commentsHeading}</h3>` above the thread (configurable text, fixed `<h3>` for "comments under post" semantic).

### 6. `parts/post-header.tsx` — shared header

- `"use client"` (kebab needs Radix DropdownMenu).
- Props: `post`, `currentUser`, `kebabOpen`, `onKebabOpenChange`, `kebabItemsArr`, `headingAs`, `format`, `labels`, `compact?: boolean`.
- Layout: `<div className="flex items-center justify-between">`.
  - Left: avatar + name+verified + (`@username · timestamp`).
  - Right: `<DropdownMenu open={kebabOpen} onOpenChange={onKebabOpenChange}>` rendering `kebabItemsArr` into `<DropdownMenuItem>`s.
  - When `kebabItemsArr.length === 0`, the kebab trigger is hidden.
- `compact: true` → smaller avatar (`h-8 w-8`), inline username, no separate timestamp row.

### 7. `parts/verified-badge.tsx` — inline SVG, RSC

```tsx
import { cn } from "@/lib/utils";

export interface VerifiedBadgeProps {
  className?: string;
  ariaLabel?: string;
}

export function VerifiedBadge({
  className,
  ariaLabel = "Verified account",
}: VerifiedBadgeProps) {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 fill-current text-primary", className)}
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}
```

### 8. `lib/defaults.ts` — default action builders

```ts
import { Bookmark, Copy, Flag, MessageCircle, Share2 } from "lucide-react";
import type { EngagementAction } from "@/registry/components/data/engagement-bar-01";
import type { CommentMenuItem } from "@/registry/components/data/comment-thread-01";
import type { Post, PostHandlers, PostCard01Variant, PostCard01Labels } from "../types";

export function defaultPostEngagementActions(
  post: Post,
  handlers: PostHandlers,
  variant: PostCard01Variant,
): EngagementAction[] {
  if (variant === "compact") {
    return [
      {
        kind: "like",
        count: post.likes,
        liked: post.isLiked ?? false,
        onToggle: handlers.onLike
          ? (next) => handlers.onLike!(post.id, next)
          : undefined,
      },
      {
        kind: "comment",
        count: post.comments,
        onClick: handlers.onComment ? () => handlers.onComment!(post.id) : undefined,
      },
    ];
  }
  // list variant: caller handles render itself; this default returns empty
  if (variant === "list") return [];

  // feed + detail: full set
  const actions: EngagementAction[] = [
    {
      kind: "like",
      count: post.likes,
      liked: post.isLiked ?? false,
      onToggle: handlers.onLike
        ? (next) => handlers.onLike!(post.id, next)
        : undefined,
    },
    {
      kind: "comment",
      count: post.comments,
      onClick: handlers.onComment ? () => handlers.onComment!(post.id) : undefined,
    },
    {
      kind: "share",
      count: post.shares,
      onClick: handlers.onShare ? () => handlers.onShare!(post.id) : undefined,
    },
    {
      kind: "bookmark",
      bookmarked: post.isBookmarked ?? false,
      onToggle: handlers.onBookmark
        ? (next) => handlers.onBookmark!(post.id, next)
        : undefined,
    },
  ];
  if (variant === "detail" && post.viewCount !== undefined) {
    actions.push({ kind: "view-count", count: post.viewCount });
  }
  return actions;
}

export function defaultPostKebabActions(
  post: Post,
  handlers: {
    onBookmark?: PostHandlers["onBookmark"];
    onShare?: PostHandlers["onShare"];
    onReport?: (postId: string) => void;
    onCopyLink?: (postId: string) => void;
  },
  labels: Required<
    Pick<PostCard01Labels, "bookmark" | "unbookmark" | "share" | "copyLink" | "report">
  >,
): CommentMenuItem[] {
  const items: CommentMenuItem[] = [];
  if (handlers.onBookmark) {
    items.push({
      label: post.isBookmarked ? labels.unbookmark : labels.bookmark,
      icon: <Bookmark className="h-4 w-4" />,
      onClick: () =>
        handlers.onBookmark!(post.id, !(post.isBookmarked ?? false)),
    });
  }
  if (handlers.onShare) {
    items.push({
      label: labels.share,
      icon: <Share2 className="h-4 w-4" />,
      onClick: () => handlers.onShare!(post.id),
    });
  }
  if (handlers.onCopyLink) {
    items.push({
      label: labels.copyLink,
      icon: <Copy className="h-4 w-4" />,
      onClick: () => handlers.onCopyLink!(post.id),
    });
  }
  if (handlers.onReport) {
    items.push({
      label: labels.report,
      icon: <Flag className="h-4 w-4" />,
      destructive: true,
      onClick: () => handlers.onReport!(post.id),
    });
  }
  return items;
}
```

### 9. `types.ts`

All public types as listed in "Final API". Plus internal `VariantInnerProps` carrying the full prop bundle to per-variant parts (avoids prop drilling).

### 10. `dummy-data.ts`

8 sample posts:
- `text-only` (no media)
- `single-image` (one image)
- `multi-image` (carousel)
- `single-video`
- `multi-video`
- `mixed-media` (image + video carousel)
- `featured` (verified author + high engagement)
- `long-text-truncated` (body > 3 lines)

Plus `dummyViewer` (re-exported from comment-thread-01's fixtures shape for consistency), `dummyCommentThread` (5 nested comments for detail demo), `createDummyEngagementSubscribe()` + `createDummyCommentSubscribe()` (synthetic delta generators).

### 11. `demo.tsx` — 7 tabs

1. **Feed** — single post + `multi-image` carousel. Heart-burst wired. Console-log all handlers.
2. **Compact** — sidebar widget with `single-image` post.
3. **List** — admin row with `featured` post.
4. **Detail** — full layout + embedded `<CommentThread01>` with `dummyCommentThread`.
5. **Text-only** — `text-only` post in feed variant; carousel slot collapses.
6. **Realtime** — feed variant with both `engagementSubscribe` + `commentSubscribe` (latter inactive in feed). Console deltas.
7. **Custom kebab + extended engagement actions** — feed variant with `kebabActions={...}` adding "Pin" and `engagementActions={(p, h, v) => [...defaultPostEngagementActions(p,h,v), customRemixAction]}`.

### 12. `usage.tsx`

Markdown-ish prose + 8 code recipes:
- Minimal feed
- Detail with embedded thread + realtime
- Compact sidebar
- List admin row
- Text-only mode
- Custom engagement actions (extending defaults)
- Custom kebab actions
- Imperative handle (focusComposer, triggerLike, etc.)

### 13. `meta.ts`

Standard `ComponentMeta`. Notable:
- `category: "data"`
- `internal: ["expandable-text-01", "media-carousel-01", "engagement-bar-01", "comment-thread-01", "video-player-01"]`
- `shadcn: ["avatar", "button", "card", "dropdown-menu"]`
- `notes`: "Tier-2 composite. Always-uncontrolled — `post` prop is initial state on mount; use `ref.current.reset(next)` to push updates. Auto-wires heart-burst when post has media + onLike + variant ∈ {feed, detail}. detail variant embeds <CommentThread01> inline. No new shadcn primitives needed."

### 14. `index.ts`

As listed in "Final API > Exported names".

## Manifest + registry.json wiring

### Manifest entry

3 lines into `src/registry/manifest.ts` (after engagement-bar-01 / comment-thread-01 imports):

```ts
import PostCard01Demo from "./components/data/post-card-01/demo";
import PostCard01Usage from "./components/data/post-card-01/usage";
import { meta as postCard01Meta } from "./components/data/post-card-01/meta";

// ... add to REGISTRY array ...
{ meta: postCard01Meta, Demo: PostCard01Demo, Usage: PostCard01Usage }
```

### registry.json entries

Two items: base + fixtures. `registryDependencies` declares ALL FIVE Tier-1 sibling slugs + 4 shadcn primitives.

```jsonc
{
  "name": "post-card-01",
  "type": "registry:block",
  "title": "Post Card 01",
  "description": "Tier-2 social-post composite — composes expandable-text-01 + media-carousel-01 + engagement-bar-01 + comment-thread-01 (detail) + video-player-01 (transitive). 4 variants (feed / compact / list / detail), auto-wired heart-burst, default engagement actions + kebab builders, slot-based render escape hatches at every connective seam, optional overlay-link via getHref. No framer-motion. Sixth ship in the social-posts-system arc.",
  "registryDependencies": [
    "expandable-text-01",
    "video-player-01",
    "media-carousel-01",
    "engagement-bar-01",
    "comment-thread-01",
    "avatar", "button", "card", "dropdown-menu"
  ],
  "dependencies": ["lucide-react"],
  "files": [
    /* 11 entries: post-card-01.tsx + 6 parts + lib/defaults.ts + types + index */
  ]
}
```

Plus `post-card-01-fixtures` sibling carrying only `dummy-data.ts` with `registryDependencies: ["post-card-01"]`.

## Test plan

Manual:

1. `pnpm tsc --noEmit` — clean
2. `pnpm lint` — clean (1 pre-existing rich-card warning OK)
3. `pnpm registry:build` — generates `post-card-01.json` + `post-card-01-fixtures.json`; spot-check `registryDependencies` lists all 5 cross-folder siblings + 4 shadcn primitives.
4. **Demo walkthrough** — all 7 tabs render; heart-burst fires on double-tap in Feed + Detail; compact has no burst; list has no interactive engagement; detail's embedded thread accepts comments.
5. **Imperative handle** — call `ref.current.triggerLike()` from a debug button; confirm bar flips + burst overlays.
6. **Cross-folder install smoke** — `pnpm dlx shadcn add http://localhost:3000/r/post-card-01.json` from a tmp Next 16 app; verify all 5 siblings auto-pull.
7. **Component docs route** at `/components/post-card-01` returns HTTP 200.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cross-folder dependency chain (5 deep) breaks shadcn CLI install | Low | High | media-carousel-01 → video-player-01 + comment-thread-01 → expandable-text-01 + engagement-bar-01 already work. Smoke-test step 6 covers. |
| Variant dispatcher's per-variant `parts/` aren't tree-shaken — full ~12KB ships | Medium | Low | Acceptable for v0.1; React Compiler + Turbopack should drop dead branches. Measure if it becomes an issue. |
| Heart-burst heuristic wires when host doesn't expect it | Low | Low | `disableHeartBurst: true` is the documented opt-out; loud callout in usage.tsx. |
| `getHref` double-duty confuses hosts | Medium | Low | Document explicitly: "passing `getHref` makes the card clickable AND adds Copy-link kebab item." Override `kebabActions` to drop Copy-link if needed. |
| Detail variant's embedded thread state drifts from external store | Medium | Medium | Same shape as comment-thread-01's always-uncontrolled lock; hosts sync via `getThreadHandle().reset(next)`. |
| Overlay-link inside `<article role="article">` breaks screen-reader article semantics | Low | Medium | Match content-card-news-01's pattern (article + absolute-positioned link with `aria-label`). Already validated there. |
| `<EngagementBar01>` per-row ALWAYS-controlled lock from comment-thread-01 doesn't apply here — bar is uncontrolled by default at post level | N/A | N/A | Different context: comment-thread-01 wraps bar to coordinate per-row state with thread reducer. Post-card has no reducer above the bar — bar's hybrid mode is correct here. |

## Implementation order

1. **Pure substrate** — `types.ts` + `lib/defaults.ts`. `pnpm tsc --noEmit` clean.
2. **Verified badge** — `parts/verified-badge.tsx` (RSC, smallest).
3. **Header** — `parts/post-header.tsx`.
4. **Feed variant** — most complex (carousel + heart-burst + overlay-link); establishes patterns.
5. **Compact + list + detail variants** — siblings.
6. **Root dispatcher** — `post-card-01.tsx` + imperative handle.
7. **Fixtures + demo + usage + meta + index**.
8. **Wire `manifest.ts`** (3 lines).
9. **Wire `registry.json`** (base + fixtures).
10. **Verify** — tsc / lint / registry:build / docs route HTTP 200.
11. **Stage 3 guide** alongside.
12. **Update STATUS.md** + trim oldest.
13. **Commit** (paused per convention).

---

**Plan signed off 2026-05-02.** Q-P locks 1–24 (R-Plan-1..4 architectural consequences of always-uncontrolled lock applied inline). Implementation begins.

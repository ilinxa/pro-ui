# post-card-01 — consumer guide

> Stage 3: how to use it. Updated for v0.1.1 (inline panels default-on, share menu, swipable likers, kasder slide layout).
>
> See [`post-card-01-procomp-description.md`](./post-card-01-procomp-description.md) for what & why,
> and [`post-card-01-procomp-plan.md`](./post-card-01-procomp-plan.md) for the implementation contract.

## 30-second mental model

`<PostCard01>` is a **Tier-2 composite** — 95% of its work is wiring the five Tier-1 social primitives ([`expandable-text-01`](../expandable-text-01-procomp/), [`media-carousel-01`](../media-carousel-01-procomp/), [`engagement-bar-01`](../engagement-bar-01-procomp/), [`comment-thread-01`](../comment-thread-01-procomp/), plus [`video-player-01`](../video-player-01-procomp/) transitively) into one cohesive social-post surface across four variants, with kasder-style **inline engagement panels** (likes / comments / share) on by default.

**Three rules:**

1. **`post` prop is mount-only initial state.** Subsequent prop reference changes are IGNORED. Use `ref.current.reset(next)` to push external updates.
2. **`variant` is required.** Choose: `feed` / `compact` / `list` / `detail`.
3. **Inline panels are the default** — tap heart to like, tap count to open likers; tap comment for inline thread; tap share for searchable user list. Pass `engagementMode="navigate"` to deactivate.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/post-card-01
```

Auto-pulls all 5 Tier-1 social siblings + 6 shadcn primitives (`avatar`, `button`, `card`, `dropdown-menu`, `input`, `popover`). Third cross-folder dependency precedent in pro-ui after `media-carousel-01 → video-player-01` and `comment-thread-01 → expandable-text-01 + engagement-bar-01`.

For fixtures (sandbox demos):

```bash
pnpm dlx shadcn@latest add @ilinxa/post-card-01-fixtures
```

## Variant cheat sheet

| Variant | Use case | Layout | Default engagement | Heart-burst | Inline panels | Comment thread |
|---|---|---|---|---|---|---|
| `feed` | Default Instagram-post in feed scroll | header → content (clamp 3) → media carousel → engagement bar | `[like, comment, share, bookmark]` | ✅ auto-wired (with media + onLike) | ✅ default-on | NOT embedded — opens inline on tap |
| `compact` | Sidebar widget / discovery rail | tight: header → content (clamp 2) + thumb (single image) → engagement bar (compact) | `[like, comment]` | ❌ | ✅ default-on | NOT embedded — opens inline on tap |
| `list` | Admin row / search results | left thumb (full-height) + right header + content (clamp 2) + counts row | none by default (counts text only) | ❌ | ✅ if engagement actions wired | ❌ |
| `detail` | Full-page post detail | header → content (no clamp) → media carousel → engagement bar → embedded `<CommentThread01>` | `[like, comment, share, bookmark, view-count]` | ✅ auto-wired | ❌ ignores engagementMode (thread is permanent) | ✅ embedded |

## Inline engagement panels (the default UX)

When `engagementMode="inline"` (the default) and the card is feed / compact / list:

- **Tap heart icon** → toggle like. If the like was just turned ON and `openLikersOnLike: true` (default), the likers panel auto-opens (kasder UX).
- **Tap like count** → toggle the inline likers strip (separate click target from the heart — wired via `engagement-bar-01`'s `onCountClick`).
- **Tap comment icon** → toggle inline `<CommentThread01>` panel below the engagement bar (with composer; scrollable; `inlineCommentsMaxHeight` default `24rem`).
- **Tap share icon** → toggle inline searchable user list (when `shareSuggestions` provided; otherwise fires `onShare(postId)`).

Only one panel is open at a time. Each panel has a "Hide" button (kasder's "Gizle") to close.

## Minimal feed (with all three panels enabled)

```tsx
import { PostCard01 } from "@/registry/components/data/post-card-01";

<PostCard01
  variant="feed"
  post={post}
  currentUser={viewer}
  // Inline panel data
  likers={preloadedLikers}
  commentThread={preloadedComments}
  shareSuggestions={recentContacts}
  // Action handlers
  onLike={(id, liked) => api.likePost(id, liked)}
  onBookmark={(id, b) => api.bookmark(id, b)}
  onShareTo={(id, user) => api.shareTo(id, user)}
  onAddComment={(content, parentId) => api.addComment(post.id, { content, parentId })}
  onLikeComment={api.likeComment}
  onLoadMoreLikers={() => api.fetchMoreLikers(post.id)}
  onLoadMoreComments={(page) => api.fetchComments(post.id, page)}
  // Linking + clipboard
  getHref={(p) => `/posts/${p.id}`}
/>
```

The card auto-wires:
- Card-level overlay-link to `getHref(post)` (clickable card header + content area in non-detail variants).
- Heart-burst on double-tap of the carousel.
- Default kebab: Bookmark / Share / Copy link / Report (each only when its handler is wired; Copy link uses `getHref` to write to clipboard).
- Inline likers panel on like count tap.
- Inline comments panel + composer on comment tap.
- Inline share menu on share tap.

## Detail with embedded thread + realtime

```tsx
import type { Subscribe, EngagementDelta, CommentDelta } from "@/registry/components/data/post-card-01";

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
  commentThread={preloadedComments}
  commentPageSize={10}
  engagementSubscribe={engagementSubscribe}
  commentSubscribe={commentSubscribe}
  onLike={api.likePost}
  onAddComment={(content, parentId) =>
    api.addComment(post.id, { content, parentId })
  }
  onLikeComment={api.likeComment}
  onDeleteComment={api.deleteComment}
  onReportComment={openReportDialog}
  onLoadMoreComments={(page) => api.fetchComments(post.id, page)}
/>
```

The two subscribe props are **separate and parallel**:
- `engagementSubscribe` is owned by post-card-01; deltas patch the local mirror + fire `onSubscribeEngagementDelta`.
- `commentSubscribe` forwards directly to `<CommentThread01>` (detail variant's permanent thread, OR feed/compact's inline panel when opened).

Memoize both via `useCallback` over stable channel references — identity changes trigger clean teardown + re-call.

## Navigate mode (deactivate inline panels)

For hosts that prefer page navigation over inline panels:

```tsx
<PostCard01
  variant="feed"
  post={post}
  engagementMode="navigate"
  onLike={api.likePost}
  onComment={(id) => router.push(`/posts/${id}#comments`)}
  onShare={(id) => navigator.share?.({ url: `/posts/${id}` })}
/>
```

In navigate mode:
- Tap heart = single-button like (heart + count bundled).
- Tap comment = fires `onComment(postId)` (host navigates).
- Tap share = fires `onShare(postId)` (host opens its own share UI).
- No likers / share panels render.

## Custom engagement actions (extending defaults)

```tsx
import {
  PostCard01,
  defaultPostEngagementActions,
  type EngagementAction,
} from "@/registry/components/data/post-card-01";
import { Wand2 } from "lucide-react";

<PostCard01
  variant="feed"
  post={post}
  engagementActions={(p, h, v): EngagementAction[] => [
    ...defaultPostEngagementActions(p, h, v),
    {
      kind: "custom",
      id: "remix",
      label: "Remix",
      icon: <Wand2 className="h-4 w-4" />,
      onClick: () => openRemix(p.id),
    },
  ]}
/>
```

The `handlers` you receive in the `engagementActions` slot are **pre-wrapped** — calling `h.onLike(id, true)` updates the local mirror first, then fires your host's `onLike`. You don't need to know about the mirror.

`defaultPostEngagementActions(post, handlers, variant, onLikeCountClick?)` accepts an optional fourth arg. When the card is in inline mode it supplies its own `onLikeCountClick` to wire the count→panel toggle. Hosts overriding the slot get a no-op for that arg unless they explicitly opt in.

## Custom kebab actions (moderator surfaces)

```tsx
<PostCard01
  variant="list"
  post={post}
  kebabActions={(p) => [
    { label: "Pin to top", onClick: () => api.pin(p.id) },
    {
      label: "Take down",
      destructive: true,
      onClick: () => api.takeDown(p.id),
    },
    { label: "Block author", onClick: () => api.block(p.author.id) },
  ]}
/>
```

Returning `[]` hides the kebab entirely.

## Compact sidebar widget

```tsx
<PostCard01
  variant="compact"
  post={post}
  likers={preloadedLikers}
  commentThread={preloadedComments}
  onLike={api.likePost}
  onAddComment={(content) => api.addComment(post.id, { content })}
  getHref={(p) => `/posts/${p.id}`}
/>
```

Compact still opens inline panels on tap — they expand below the row.

## Imperative handle

```ts
interface PostCard01Handle {
  openKebab: () => void;
  /** Card-level: bar.triggerLike() + setBurstKey(k+1) when wired. */
  triggerLike: () => void;
  getCurrentPost: () => Post;
  reset: (next: Post) => void;
  getEngagementHandle: () => EngagementBar01Handle | null;
  getThreadHandle: () => CommentThread01Handle | null;
}
```

Common patterns:

- **Programmatic like + burst** from a feed-level keyboard shortcut: `ref.current?.triggerLike()` (canonical "Instagram tap").
- **Surgical engagement-bar control** without burst: `ref.current?.getEngagementHandle()?.triggerLike()`.
- **Push external state**: `ref.current?.reset(updatedPost)`.
- **Read current mirrored state** (post + engagement deltas applied): `ref.current?.getCurrentPost()`.
- **Drive embedded comment thread externally** (detail variant): `ref.current?.getThreadHandle()?.reset(updatedComments)`.

## Slots

- **`renderHeader(post, helpers)`** — full takeover for the header row (avatar + name + verified + timestamp + kebab).
- **`renderContent(post)`** — full takeover for the body. Default is `<ExpandableText01>`. Override for rich Plate content / mentions / hashtags / link previews.
- **`renderMedia(media, helpers)`** — full takeover for the media block. `helpers.onDoubleTap` is the wired heart-burst trigger (when applicable) — wire it through if you want the canonical UX.
- **`engagementActions(post, handlers, variant)`** — full takeover for the actions array. `handlers` are pre-wrapped.
- **`renderEngagementBar(post, defaults)`** — full takeover for the bar UI. `defaults.actions` is the resolved actions array.
- **`kebabActions(post)`** — full takeover for the header kebab. `[]` hides it.
- **`commentActions(comment, helpers)`** — forwarded to `<CommentThread01>` (inline panel and detail-variant thread).
- **`renderCommentSection(post, handlers)`** — full takeover for the entire comments block (detail variant only). Default builds `<CommentThread01>` with all forwarded props.

## i18n

```tsx
const TR_LABELS: PostCard01Labels = {
  // header / kebab
  verifiedBadgeLabel: "Onaylanmış hesap",
  bookmark: "Kaydet",
  unbookmark: "Kaydedilenlerden Çıkar",
  share: "Paylaş",
  copyLink: "Bağlantıyı kopyala",
  report: "Şikayet Et",
  commentsHeading: "Yorumlar",
  // inline panels
  likersHeading: "Beğenenler",
  likersMoreLabel: "+{count} kişi daha",
  shareHeading: "Şununla paylaş…",
  shareSearchPlaceholder: "Kişi ara…",
  shareEmptyLabel: "Eşleşme yok.",
  hidePanelLabel: "Gizle",
  // formatters
  formatRelativeTime: (date, now) => formatDistanceToNow(date, { addSuffix: true, locale: tr }),
  // forwarded
  engagementLabels: { /* engagement-bar-01 labels */ },
  commentLabels: { /* comment-thread-01 labels */ },
};

<PostCard01 labels={TR_LABELS} {...rest} />
```

`DEFAULT_POST_CARD_LABELS` exported for spread + override. `labels.engagementLabels` and `labels.commentLabels` are forwarded straight to the child components — same shapes they accept directly.

## Accessibility

- Card root is `<article role="article" aria-labelledby={authorId}>` — author name carries the auto-generated id (via `useId`).
- Author name is `<h3>` for feed/compact/list; `<h2>` for detail (configurable via `headingAs`).
- Verified badge is an `<svg role="img" aria-label="...">` (configurable via `labels.verifiedBadgeLabel`).
- Heart-burst is `aria-hidden="true"` (decorative — like state announces via `aria-pressed` on the bar's like action, inherited from engagement-bar-01).
- Carousel a11y inherits from `<MediaCarousel01>`.
- Detail variant has `<h3>` for the comments section heading (default "Comments", configurable via `labels.commentsHeading`).
- Overlay-link in feed/compact/list has `aria-label={post.content.slice(0, 80)}` for screen-reader announcement.
- Likers strip uses `role="list"` + `role="listitem"`; hide button is a real `<button>`.
- Share panel uses `role="list"` + `role="status"` for the empty-state.

## Composition example: a full feed

```tsx
function Feed({ posts, viewer, channel }: Props) {
  return (
    <ul className="flex flex-col gap-4">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard01
            variant="feed"
            post={post}
            currentUser={viewer}
            likers={post.recentLikers}
            commentThread={post.previewComments}
            shareSuggestions={viewer.recentContacts}
            engagementSubscribe={useCallback(
              (h) => channel.on(`post-${post.id}-engagement`, h),
              [post.id, channel],
            )}
            onLike={(id, liked) => api.likePost(id, liked)}
            onShareTo={(id, user) => api.shareTo(id, user)}
            onBookmark={(id, b) => api.bookmark(id, b)}
            onAddComment={(content) => api.addComment(post.id, { content })}
            onLikeComment={api.likeComment}
            onLoadMoreLikers={() => api.fetchMoreLikers(post.id)}
            onLoadMoreComments={(page) => api.fetchComments(post.id, page)}
            getHref={(p) => `/posts/${p.id}`}
            linkComponent={NextLink}
          />
        </li>
      ))}
    </ul>
  );
}
```

## What's NOT in v0.1.1

- **Inline edit affordance** — locked deferred for the entire arc.
- **Reaction emojis** (Facebook-style 6-emoji popover) — engagement-bar-01 v0.2 candidate.
- **Inline thread auto-load on detail page** — detail variant takes pre-loaded `commentThread` prop.
- **Auto-track impressions** for `view-count` — host owns the count.
- **Long-press preview** (force-touch peek) — out of scope.
- **Multi-author posts** — `post.author` is a single object in v0.1.x.
- **Mention chips / hashtag highlighting** — render via `renderContent` slot.
- **Share popover (anchored)** — current share menu renders inline below the engagement bar to match the likes/comments panel architecture. Anchored popover is a v0.2 candidate.

## v0.1.1 patch notes (since first ship)

- **Inline engagement panels promoted to the default.** `engagementMode` defaults to `"inline"` (was `"navigate"`). Tap-to-open panels work on every variant except `detail` (which always shows its embedded thread).
- **`<LikersStrip>` part** — horizontal swipable avatar strip with paginating `+N` pill. Touch swipe via `touch-action: pan-x`; desktop drag-to-scroll via pointer-event handlers. Symmetric grid (fixed-height name+username slot) so columns line up regardless of which users have a username. Closeable via `onClose` ("Hide" button).
- **`<ShareMenu>` part** — searchable inline user list with avatar / name / @username / Send icon per row. Local filter or async `onShareSearch`. Empty-state with `role="status"`.
- **Heart vs count split** — wired via `engagement-bar-01`'s new `like.onCountClick` action property. The split is a feature of the engagement bar (works wherever the bar renders); post-card-01 just supplies the count callback under inline mode.
- **List variant image** — full-height stretch (was `h-24 w-24`); content area gets its own `p-3` so the image edge sits flush with the card border.
- **Carousel visual matches kasder** — slide layout uses `mx-1` gutters + `first:ml-[7.5%] last:mr-[7.5%]` edge padding (only when `loop=false`); inactive neighbors get `scale-95 opacity-60 blur-[1px]` for the "focused-bigger / neighbors-smaller-blurred" effect; gallery variant gets soft edge gradients.
- **Video URL** — kasder's w3schools demo (`mov_bbb.mp4` + `movie.mp4`) for reliable test playback.
- **9-tab demo** — Feed / Compact / List / Detail / Text-only / **Video** (new) / Realtime / **Inline TR** (new, kasder labels) / Custom.
- **New props on `PostCard01Props`:** `engagementMode` / `likers` / `onLoadMoreLikers` / `shareSuggestions` / `onShareSearch` / `onShareTo` / `inlineCommentsMaxHeight` / `defaultInlinePanel` / `openLikersOnLike` / `disableHeartBurst` / `onCopyLink` / `onReport`.
- **New labels:** `likersHeading` / `likersMoreLabel` / `hidePanelLabel` / `shareHeading` / `shareSearchPlaceholder` / `shareEmptyLabel`.
- **New types exported:** `PostLikeUser` / `EngagementMode`.
- **New dependencies:** shadcn `input` + `popover` (already installed in the project).

## Cross-folder import contract

When this component composes another registry component (cross-folder import), it imports only from the OTHER component's `<slug>.tsx` file — never from `lib/`, `hooks/`, or `parts/` sub-folders. Conversely, when other registry components compose `post-card-01`, they import only from `post-card-01.tsx`.

The constraint comes from how `pnpm dlx shadcn add` rewrites import paths in installed copies; sub-folder paths often don't survive cleanly. Anything you want shareable across folder boundaries MUST be re-exported from `<slug>.tsx`.

See [`docs/component-guide.md` §11.6](../../component-guide.md) — *Cross-folder import constraint*.

---

# v0.2.0 — additive expansion (2026-05-27)

v0.2.0 is fully backwards-compatible — every v0.1 demo + every v0.1 consumer call pattern compiles + renders identically. The expansion is six buckets per the description: permissions resolver / responsive sweep / schema expansion / engagement extraction (engagement-bar-01 v0.2.x sibling ship) / display badges + content gates / sibling post-editor-01 procomp (separate slug). Below are the consumer-facing sections.

## Permissions toggle — `viewerMode` + `permissions` + `canPerformAction`

Three new optional props compose into a single dual-mode kebab resolver:

```tsx
<PostCard01
  variant="detail"
  post={ownPost}
  viewerMode="owner"            // (a) high-level role flag
  permissions={{ canDelete: false }}    // (b) per-action override
  canPerformAction={(action) =>          // (c) universal predicate (per-action per-render)
    moderator ? true : undefined
  }
  onEdit={(id) => api.openEditor(id)}
  onDelete={(id) => api.deletePost(id)}
  onChangeVisibility={(id, current) =>     // host opens its own picker
    setVisibilityPickerFor({ postId: id, currentVisibility: current })
  }
  /* + onPin / onMarkSensitive / onSeeAnalytics / onBlockAuthor / onMuteAuthor */
/>
```

**Resolution order** (most → least specific, per plan §3):
1. `canPerformAction(action, post)` returning `true | false` wins everything for that action.
2. `permissions[canX]` per-field overrides the mode default.
3. `viewerMode`-derived defaults from `PERMISSION_DEFAULTS_BY_MODE`.
4. Library-baseline default (legacy v0.1 mode — resolver NOT called).

**Legacy mode** is automatic: when `viewerMode` + `permissions` + `canPerformAction` are ALL `undefined`, the helper takes the v0.1 handler-driven path. Items are built from "which handler is wired" — exact v0.1 behavior. Zero drift.

**`canPerformAction` performance contract**: called per-action per-render (cheap). Host should memoize the callback identity via `useCallback`. The matrix itself (mode + permissions merge) is `useMemo`-cached per `(viewerMode, permissions)` identity inside the card.

### Owner kebab order (when all owner-side handlers wired)
Edit · Pin/Unpin · Change visibility · Mark/Unmark sensitive · See analytics · Bookmark · Share · Copy link · Translate · ⟨separator⟩ · Delete (destructive)

### Viewer kebab order (when all viewer-side handlers wired)
Bookmark · Share · Copy link · Translate · Mute author · ⟨separator⟩ · Block author (destructive) · Report (destructive)

## Visibility — host opens its own picker

`onChangeVisibility(postId, currentVisibility)` is a **single trigger** — the library ships **no** visibility picker UI (Q-P42 lock). The host opens its own banner / sheet / dialog wherever its UX wants:

```tsx
<PostCard01
  post={p}
  viewerMode="owner"
  onChangeVisibility={(id, current) => setVisibilityPicker({ id, current })}
/>
{visibilityPicker && (
  <YourCustomVisibilityDialog
    postId={visibilityPicker.id}
    currentVisibility={visibilityPicker.current}
    onSubmit={(next) => api.changeVisibility(visibilityPicker.id, next)}
    onClose={() => setVisibilityPicker(null)}
  />
)}
```

`PostVisibility` is a **Facebook-style extensible string union** — 6 base values (`"public" | "followers" | "friends" | "circle" | "only-me" | "private"`) + `(string & {})` for granular per-app values like `"specific-friends"` or `"everyone-except-bob"`. Library renders default labels + icons for the 6 base values; custom values fall back to `labels.visibilityCustom` (default `"Custom"`).

## Schema expansion — 12 new optional `Post` fields

```ts
interface Post {
  // ... v0.1 fields
  isPinned?: boolean;          // "Pinned" badge above the header
  isSensitive?: boolean;       // sensitive-media gate over the media block
  sensitiveReason?: string;    // explanatory copy in the gate
  visibility?: PostVisibility; // icon + label badge next to timestamp
  editedAt?: Date | string | number;  // "(edited)" suffix
  mentions?: PostMention[];    // ranges into post.content (UTF-16); opt-in highlight via renderContent + MentionText
  tags?: string[];             // auto-rendered chip row below content
  location?: PostLocation;     // place chip in header sub-row
  language?: string;           // BCP-47; gates onTranslate kebab item
  replyTo?: PostReplyTo;       // "Replying to @username" sub-line above header (feed + detail only)
  repostOf?: Post;             // nested compact mini-card (feed + detail only)
  linkPreview?: LinkPreview;   // OG card below content
  poll?: PostPoll;             // inline poll widget
}
```

Every field is optional — v0.1 consumers' narrower `Post` shapes still satisfy the type via structural subtyping.

## Sensitive-media gate

When `post.isSensitive === true`, the media block renders behind a backdrop-blur overlay with a "Show" button. Viewer tap fires `onRevealSensitive(postId)` (analytics hook) and flips the local mirror `sensitiveRevealed` to `true`. The gate is per-post, not per-`MediaItem`.

- Wired in feed + detail variants only (per description §1.3). Compact + list ignore.
- Host can opt out via `disableSensitiveGate` or take over the render via `renderSensitiveGate?(post, { onReveal })`.
- Keyboard-operable; `motion-reduce:transition-none` for `prefers-reduced-motion`.

## Inline poll widget

Renders below content + above any link-preview. Two views:

- **Vote view** — viewer hasn't voted yet + poll not closed. List of vote buttons (`h-11` per WCAG 2.5.5). Tap fires `onVotePoll(postId, optionId)` + optimistically flips the local mirror.
- **Results view** — owner OR voted OR closed. Bar chart with `transition-[width]` (motion-reduce safe). Viewer's option highlighted via `ring-1 ring-primary`.

```tsx
<PostCard01
  post={postWithPoll}
  onVotePoll={(postId, optionId) => api.castVote(postId, optionId)}
  viewerMode="viewer"
/>
```

Optimistic vote semantics: the library increments the picked option's `voteCount` + the displayed total immediately. Host can **reject** by calling `ref.current.reset(originalPost)` — that clears the local mirror so the bars roll back to the server-resolved counts.

**Multi-select polls** (`poll.multiSelect: true`) currently render the same single-vote UI in v0.2.0. Multi-select behavior is a v0.2.x / v0.3 follow-up.

## OG link-preview card

Host pre-fetches `post.linkPreview` (Q-D4 lock — library is fetch-free). Card renders below content + above any media:

```ts
interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
}
```

A bare URL with no metadata renders as `null` (the library skips rather than showing an empty card). Override with `onLinkPreviewClick` to handle custom navigation (e.g., in-app browser), or `renderLinkPreview` for full takeover.

`<LinkPreviewCard>` is internal-only (not sub-exported in v0.2.0 — flagged as a potential v0.2.x sub-export follow-up).

## Repost mini-card

When `post.repostOf` is set, a nested counts-only compact card renders below content. Per Q-P30, the nested card runs with:

- `variant="compact"`
- `engagementMode="navigate"` (no inline panels)
- `viewerMode="viewer"` (no owner kebab)
- `engagementActions={() => []}` (engagement bar suppressed)

A foreground click overlay captures all input (button if `onRepostOfClick` is provided, `<LinkComponent href={getHref(repostOf)}>` if `getHref` is set, non-interactive otherwise). The nested card uses `pointer-events-none` to avoid HTML-invalid nesting (e.g., article-inside-button) and to keep clicks routed to the overlay.

**Recursion-strip:** the nested post has its own `repostOf` field forced to `undefined` to prevent infinite nesting. Defense-in-depth — the compact variant doesn't render `RepostOfCard` either, so a chain bottoms out either way.

`RepostOfCard` is sub-exported for standalone host-side use (e.g., admin "show all reposts of post X" surfaces).

## Mentions + tags + location + replyTo + edited

- **Mentions:** `post.mentions` carries `{ id, name, username?, range }`. Library default `renderContent` is `<ExpandableText01 content={post.content}>` and does NOT auto-highlight mentions (ExpandableText01's `content: string` API can't accept JSX). Opt-in via the slot:
  ```tsx
  <PostCard01
    post={p}
    renderContent={(p) => (
      <MentionText
        content={p.content}
        mentions={p.mentions ?? []}
        onMentionClick={(id) => router.push(`/u/${id}`)}
      />
    )}
  />
  ```
- **Tags:** `post.tags?: string[]` auto-renders a chip row below content via `<TagChips>` (feed + detail only). `onTagClick(tag)` fires when a chip is tapped.
- **Location:** `post.location` renders a `<MapPin>` + name chip in the header sub-row beside the timestamp. `onLocationClick(location)` fires when tapped.
- **replyTo:** `post.replyTo` renders a "Replying to @username" sub-line above the header (feed + detail only — hidden on compact + list). The username button fires `onMentionClick(authorId)`.
- **editedAt:** `post.editedAt` renders an "(edited)" suffix after the timestamp, with `title={editedAt}` tooltip showing the exact time.

## Responsive sweep — §2.1-B step rules

Padding / avatar / body-text / list-thumb step at `sm:` / `md:` / `lg:` per the description's step table. Touch targets are ≥44×44 px (kebab is `h-11 w-11`; poll vote buttons are `h-11`; likers-strip `+N` pill is `h-11 sm:h-12`).

When you author a custom slot (`renderHeader`, `renderContent`, etc.), match the step convention so the responsive narrative stays coherent across the card.

## Imperative handle additions

```ts
interface PostCard01Handle {
  // v0.1
  openKebab(): void;
  triggerLike(): void;
  getCurrentPost(): Post;
  reset(next: Post): void;
  getEngagementHandle(): EngagementBar01Handle | null;
  getThreadHandle(): CommentThread01Handle | null;
  // v0.2.0
  triggerEdit(): void;            // fires onEdit(id) — bypasses permission matrix
  triggerDelete(): void;          // fires onDelete(id)
  triggerPin(): void;             // fires onPin(id, !isPinned)
  revealSensitive(): void;        // flips sensitiveRevealed=true + fires onRevealSensitive
  votePoll(optionId: string): void;  // optimistic vote + fires onVotePoll
}
```

Triggers bypass the permission matrix — the matrix gates the UI, the handle is the programmatic escape hatch. If the corresponding handler isn't wired, the method is a no-op.

`reset(next)` clears the local mirror including v0.2.0 fields (`pollVote`, `sensitiveRevealed`).

## Sub-exports

```ts
import {
  PostCard01,
  VerifiedBadge,          // v0.1
  MentionText, TagChips,  // v0.2.0
  RepostOfCard,           // v0.2.0
  PollWidget,             // v0.2.0
  defaultPostEngagementActions,
  defaultPostKebabActions,
  LikersStrip, ShareMenu, // v0.2.0 — re-exported from engagement-bar-01 for soft-compat
} from "@ilinxa/post-card-01";
```

`LinkPreviewCard` and `SensitiveGate` are NOT sub-exported in v0.2.0 — flagged as potential v0.2.x consistency follow-ups (the asymmetry is documented in the GATE 3 review).


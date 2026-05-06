# comment-thread-01 — consumer guide

> Stage 3: how to use it. Authored alongside the v0.1 implementation.
>
> See [`comment-thread-01-procomp-description.md`](./comment-thread-01-procomp-description.md) for what & why,
> and [`comment-thread-01-procomp-plan.md`](./comment-thread-01-procomp-plan.md) for the implementation contract.

## 30-second mental model

`<CommentThread01>` is a recursive comment panel with built-in composer + optimistic state + realtime. It composes [`expandable-text-01`](../expandable-text-01-procomp/) for long bodies and [`engagement-bar-01`](../engagement-bar-01-procomp/) `variant="compact"` for the per-row like action.

Three rules to internalize:

1. **`comments` prop is initial state ON MOUNT only.** Subsequent prop reference changes are IGNORED. To push external updates, use the imperative handle's `reset(next)` or `dispatch(action)`.
2. **Realtime via `Subscribe<CommentDelta>`.** Identity-stable required (`useCallback` over a stable channel). Component re-subscribes on identity change.
3. **`currentUser` absent → composer hidden.** Use `composerEmptyState` to render a sign-in CTA in its place.

## Install (consumer side)

```bash
pnpm dlx shadcn@latest add @ilinxa/comment-thread-01
```

This auto-pulls `expandable-text-01` + `engagement-bar-01` (cross-folder dependencies declared via `registryDependencies`) plus shadcn primitives `avatar`, `button`, `dropdown-menu`, `textarea`. No `react-textarea-autosize`, no `date-fns`, no `framer-motion` peer deps.

For fixtures (sandbox demos):

```bash
pnpm dlx shadcn@latest add @ilinxa/comment-thread-01-fixtures
```

## Minimal usage

```tsx
import { CommentThread01 } from "@/registry/components/data/comment-thread-01";

<CommentThread01 comments={post.comments} />
```

Read-only thread. No composer, no realtime, no callbacks.

## With composer + optimistic add

```tsx
<CommentThread01
  comments={post.initialComments}
  currentUser={{ id: viewer.id, name: viewer.name, avatar: viewer.avatarUrl }}
  onAddComment={async (content, parentId) => {
    const created = await api.addComment(post.id, { content, parentId });
    return created; // component swaps temp comment for the real one
  }}
  onLikeComment={(id, nextLiked) => api.likeComment(id, nextLiked)}
  onDeleteComment={(id) => api.deleteComment(id)}
  onReportComment={(id) => openReportDialog(id)}
/>
```

- Posting: temp comment appears at the top instantly with `id: temp-${uuid}`. Once `onAddComment` resolves with a real `Comment`, the temp is swapped for the real one (real id wins for downstream like/delete).
- If the host returns `void`, the temp comment persists with its temporary id. Host is responsible for updating via realtime delta or via `ref.current.reset(next)`.
- Like / delete fire optimistic state changes locally first, then call back. Hosts revert via realtime delta or `reset(next)`.

## Realtime via `Subscribe<CommentDelta>`

```tsx
import type { Subscribe, CommentDelta } from "@/registry/components/data/comment-thread-01";

const subscribe = useCallback<Subscribe<CommentDelta>>(
  (handler) => channel.on("comment", handler),
  [channel],
);

<CommentThread01
  comments={post.initialComments}
  currentUser={viewer}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("comment-delta", d)}
/>
```

The contract:

```ts
type CommentDelta =
  | { kind: "added";   comment: Comment; parentId?: string }
  | { kind: "edited";  commentId: string; content: string }
  | { kind: "removed"; commentId: string }
  | { kind: "liked";   commentId: string; liked: boolean; count: number };
```

- **Hosts must memoize `subscribe`** via `useCallback` over a stable channel reference. Identity changes trigger a clean teardown + re-call. Rapid identity churn drops in-flight deltas.
- `onSubscribeDelta` fires for every delta the subscription emits — useful for analytics / cross-component coordination.
- The component does NOT manage transport (websocket / SSE / channel) — the host owns that. We just consume a stream contract.

## Custom kebab actions

```tsx
import type { CommentMenuItem } from "@/registry/components/data/comment-thread-01";

<CommentThread01
  comments={comments}
  currentUser={viewer}
  commentActions={(comment, { isOwn, currentUser }) =>
    [
      isOwn && { label: "Pin", onClick: () => api.pinComment(comment.id) },
      isOwn && { label: "Delete", destructive: true, onClick: () => api.deleteComment(comment.id) },
      !isOwn && { label: "Block author", onClick: () => api.block(comment.author.id) },
      { label: "Report", onClick: () => openReportDialog(comment.id) },
    ].filter(Boolean) as CommentMenuItem[]
  }
/>
```

- Returning `[]` hides the kebab entirely for that comment.
- Default kebab (when `commentActions` is omitted) is **own-only Delete + Report**:
  - **Delete** appears only when `currentUser?.id === comment.author.id`.
  - **Report** appears only when `onReportComment` is wired.
- Hosts wanting moderator semantics override `commentActions` and ignore the `isOwn` check.

## Standalone composer

```tsx
import { CommentComposer } from "@/registry/components/data/comment-thread-01";

<CommentComposer
  currentUser={viewer}
  placeholder="Share your thoughts on this article…"
  onSubmit={async (content) => api.addArticleComment(article.id, content)}
/>
```

Use cases:
- Article-page hero CTAs ("Comment as a reply") that don't render a thread yet
- Document-annotation surfaces where the composer appears outside the thread context
- Tighter control over keyboard / autosize without inheriting thread state

The standalone composer is **fire-and-forget** (`onSubmit: (content) => Promise<void> | void`). It doesn't track posted comments, no realtime, no `Comment` return swap.

## Pagination — load older comments

```tsx
<CommentThread01
  comments={post.firstPage}
  pageSize={10}
  onLoadMore={(page) => api.fetchComments(post.id, page)}
/>
```

- The "Load older comments" button only appears when `comments.length === pageSize` AND `onLoadMore` is provided.
- Subsequent pages append below (`commentReducer` handles `append-page`).
- Direction is fixed: newest at top, "Load older" at bottom. There's no upward pagination in v0.1.

## Slots — full takeover

### `renderNode` — rich per-row UI

```tsx
<CommentThread01
  comments={comments}
  currentUser={viewer}
  renderNode={(comment, depth, helpers) => (
    <RichCommentRow
      comment={comment}
      depth={depth}
      mentions={parseMentions(comment.content)}
      onLike={helpers.onLike}
      onReply={helpers.onReply}
      onDelete={helpers.onDelete}
    />
  )}
/>
```

The thread still owns the recursive structure, the inline reply composer, and the kebab. `renderNode` only replaces the row's body.

### `renderViewReplies` — navigate-to-detail link

Default behavior past `maxDepth` is inline-expand. Override for a navigate-to-detail-page link:

```tsx
<CommentThread01
  comments={comments}
  renderViewReplies={(parentId, count) => (
    <Link
      href={`/posts/${post.slug}/comments/${parentId}`}
      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
    >
      View {count} replies →
    </Link>
  )}
/>
```

### `composerEmptyState` — sign-in CTA

```tsx
<CommentThread01
  comments={comments}
  currentUser={undefined}
  composerEmptyState={
    <Card className="flex items-center justify-between p-3">
      <span className="text-sm text-muted-foreground">Sign in to comment.</span>
      <Button size="sm" onClick={onSignIn}>Sign in</Button>
    </Card>
  }
/>
```

Pass `null` to suppress the bottom area entirely.

## Controlled-mode escape hatch

Hosts driving comments via external state (Redux / Zustand / TanStack Query):

```tsx
const ref = useRef<CommentThread01Handle>(null);

useEffect(() => {
  ref.current?.reset(externalComments);
}, [externalComments]);

<CommentThread01 ref={ref} comments={externalComments} />
```

Or for surgical updates without overwriting the whole tree:

```tsx
ref.current?.dispatch({
  kind: "patch-content",
  commentId: "c123",
  content: "(server-side translation arrived)",
});
```

The full reducer is publicly exported for hosts that want to drive comments from their own store entirely:

```tsx
import { commentReducer, useCommentState } from "@/registry/components/data/comment-thread-01";
```

## Compact variant for side rails

```tsx
<CommentThread01
  variant="compact"
  comments={comments}
  currentUser={viewer}
  maxDepth={1}
  indentPx={16}
/>
```

`variant="compact"` tightens body line-clamp (`bodyMaxLines` defaults to 2 in compact, 4 in default). Use for narrow side-rails / popovers.

## Imperative handle reference

```ts
interface CommentThread01Handle {
  focusComposer: () => void;
  openReply: (parentId: string) => void;
  getCurrentComments: () => Comment[];
  reset: (next: Comment[]) => void;
  dispatch: (action: CommentLocalAction) => void;
}
```

Common patterns:

- **Auto-focus composer** on mount: `useEffect(() => ref.current?.focusComposer(), []);`
- **Programmatically open reply** (e.g., from a "Reply to top comment" CTA): `ref.current?.openReply(topCommentId);`
- **Read current state** (e.g., before submit): `const current = ref.current?.getCurrentComments();`

## i18n

Pass a `labels` object to override defaults:

```tsx
const TR_LABELS: CommentThreadLabels = {
  composerPlaceholder: "Yorum yaz…",
  composerSend: "Gönder",
  composerCancel: "İptal",
  like: "Beğen",
  unlike: "Beğeniyi geri al",
  reply: "Yanıtla",
  delete: "Sil",
  report: "Şikayet et",
  viewReplies: (count) => `${count} yanıtı görüntüle`,
  loadMore: "Daha eski yorumları yükle",
  emptyState: "Henüz yorum yok — ilk siz olun.",
  signInPrompt: "Yorum yapmak için giriş yapın",
  formatRelativeTime: (date, now) => formatDistanceToNow(date, { addSuffix: true, locale: tr }),
};

<CommentThread01 labels={TR_LABELS} {...rest} />
```

`DEFAULT_COMMENT_THREAD_LABELS` is exported for spread + override.

## Accessibility

- Each comment is a `<article role="article" aria-labelledby={authorNameId}>` (auto-generated via `useId()`).
- Like button uses `aria-pressed` (inherited from `engagement-bar-01`'s compact like).
- "View N replies" link uses `aria-controls={repliesContainerId}`.
- Reply / delete / report buttons have explicit `aria-label` from `labels`.
- Composer textarea is labelled (`aria-label`); `aria-busy` flips during submit.
- Kebab is `pointer-coarse:opacity-100` (touch users see it without hover) + `group-focus-within:opacity-100` (keyboard users see it without hover).
- Inline reply composer focus management: on submit/cancel, focus returns to the parent comment's "Reply" button.

## What's NOT in v0.1

- **Edit affordance** — `CommentDelta.edited` is in the realtime contract for forward-compatibility, but no UI for editing in v0.1.
- **Mentions / hashtags** — render rich content via `renderNode` if you need them now; built-in tag UI lands in v0.2.
- **Voting (up/down)** — like-only.
- **Per-comment subscription** — one subscribe for the whole thread; no per-node subscribe.
- **Lazy-load deeper replies (`onLoadReplies`)** — v0.1 trusts `replies` to be fully loaded for visible nodes. v0.2 candidate.
- **Animated insert/remove** — no framer-motion.
- **Search within thread** — out of scope.

## Composing into Tier-2 / Tier-3

When `post-card-01` (next ship) lands, it'll forward `subscribe` / `currentUser` / `commentActions` from the post card down into `<CommentThread01>`. The realtime contract is identical between `engagement-bar-01` and `comment-thread-01` — a single `Subscribe<TDelta>` mental model across the family.

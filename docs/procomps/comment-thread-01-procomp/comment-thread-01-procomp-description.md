# comment-thread-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — derived from kasder `PostEngagementPanel.tsx` (468 LOC). The action row already shipped as [`engagement-bar-01`](../engagement-bar-01-procomp/); we now extract the comments concern (panel + composer + per-comment row) into its own sealed component, while *adding* recursive replies + realtime — neither of which kasder's source has. Visual reference for the per-comment row is [`PostEngagementPanel.tsx` lines 413–467](../../migrations/social-posts-system/original/posts/PostEngagementPanel.tsx) (the `CommentItem` sub-component).
>
> **Fifth of 8** in the social-posts-system arc. **Tier-1 primitive that composes two siblings** ([`expandable-text-01`](../expandable-text-01-procomp/) for long bodies, [`engagement-bar-01`](../engagement-bar-01-procomp/) `variant="compact"` for per-row like+reply). This is the **second cross-folder import** in pro-ui's registry, after `media-carousel-01 → video-player-01`. `registry.json` will declare `registryDependencies: ["expandable-text-01", "engagement-bar-01"]` so installs auto-pull siblings.
>
> **Realtime contract** locked in [analysis.md §"Realtime via subscription contract"](../../migrations/social-posts-system/analysis.md) — same `Subscribe<TDelta>` shape engagement-bar-01 uses; same `controlledRef` + `onSubscribeDeltaRef` mirror pattern from [`use-engagement-state.ts`](../../../src/registry/components/data/engagement-bar-01/hooks/use-engagement-state.ts).
>
> **v0.1 deferrals (locked in analysis):** no edit affordance (kasder doesn't have one — UI-side; the `CommentDelta.edited` realtime variant *is* part of the contract so future-v0.2 edit support is non-breaking), no mentions / hashtags, no voting (kasder is like-only), no collapse-by-default, no per-comment subscription.

## Problem

Every social product surface needs a comment panel under content: **flat list with avatar + name + body + timestamp + like + reply, recursive replies up to N depth, "view more replies" past the cap, an autosize composer at the bottom, optimistic add/like/delete, realtime updates as new comments arrive, pagination for older comments, a kebab menu per row** — and each of those grows hardcoded per consumer:

- Hardcoded comment shape per app — no `renderNode?` slot, no escape hatch for richer per-row UI (mentions, attachments, reactions)
- Recursive depth either unbounded (Reddit-style — UI breaks past 5+ levels on mobile) or absent entirely (flat list, replies lose their parent context)
- Composer rolled per-app — `<Input>` vs `<Textarea>` vs autosize, sometimes Enter-to-submit, sometimes not, often no Shift+Enter newline support
- Long comment bodies either truncated by the surrounding card (loses content) or take over the page (breaks the list rhythm) — no expandable-text behaviour
- No realtime contract — every consumer reinvents websocket-to-state plumbing, then has to reconcile optimistic local state against incoming deltas (drift bugs)
- Per-row kebab actions hardcoded (Delete-only / Delete+Report / Edit+Delete+Report) — no slot for product-specific items (Pin / Translate / Block author)
- Hardcoded labels (Turkish / English mixed at the file level)
- `currentUser` absent → either composer renders broken (anonymous post crash) or composer hidden silently with no sign-in CTA

`comment-thread-01` is the answer: a single recursive thread component with a discriminated `CommentDelta` realtime contract, an autosize composer with sane keyboard ergonomics, slot-based escape hatches for the per-row render and the view-more-replies link, an optimistic local state + reducer pair hosts can plug into, and per-row composition of `expandable-text-01` + `engagement-bar-01` so long bodies and like/reply behaviour come for free.

## In scope

### The thread + the recursive node

- **`comments: Comment[]` (required)** — top-level array. Each `Comment` carries optional `replies?: Comment[]`, recursing.

  ```ts
  export interface Comment {
    id: string;
    author: { id: string; name: string; username?: string; avatar?: string };
    content: string;
    createdAt: Date | string | number;
    likes: number;
    isLiked?: boolean;
    replies?: Comment[];
    /** Server-known total. Used purely as the label hint when `replies.length` undercounts (`viewReplies(replyCount ?? replies.length)`). v0.2 will pair with `onLoadReplies` to actually fetch the missing replies. */
    replyCount?: number;
  }
  ```

  Note `createdAt` is `Date | string | number` — same coercion convention used by `event-card-01` / `progress-timeline-01`. Internal `toDate()` helper handles all three.

- **Recursive `<CommentNode>` part** — renders one comment row + maps over `replies` capped by the current per-node `expandedToDepth`. Depth tracked by recursion level. Indentation per depth = 16px by default (kasder convention), configurable via `indentPx?: number`.

- **`maxDepth?: number` (default 2)** — caps **initial** render. Past `maxDepth`, replies render flat under the deepest visible comment with a "view N replies" inline-expand link. Default click behaviour: expand the next depth level **inline** (no max ceiling on user-driven expansion — matches Twitter / Instagram). Hosts wanting navigate-to-detail-page semantics override via the `renderViewReplies?(parentId, count)` slot.

- **`<CommentNode>` per-row composition** — each node renders:
  - `<Avatar>` (shadcn primitive — already installed)
  - Header row: bold author name + `@username` muted + relative time
  - Body via `<ExpandableText01 content={comment.content} maxLines={4}>` — long comments collapse to 4 lines with the toggle from the sibling primitive (no flash-of-untruncated-content per `expandable-text-01`'s measure-based detection).
  - Action row: **`<EngagementBar01 variant="compact" actions={[like-only]}>` + a sibling text-only `<button>Reply</button>`**, then the kebab. The bar carries the `kind: "like"` action ONLY (count-bearing engagement); Reply is a separate sibling button (state-trigger for the inline composer, not engagement). Conflating Reply into the bar's `kind: "custom"` would force an icon and re-frame Reply as an engagement count, neither of which fits.
  - **Per-row `<EngagementBar01>` is ALWAYS in controlled mode** — thread-level reducer owns the `isLiked` + `likes` state for every comment so realtime `liked` deltas patch through one path. Bar receives `liked` + `count` per render and just fires `onToggle`; thread reducer dispatches and re-emits new props. Uncontrolled-per-row would race the reducer + delta routing and silently drift.
  - Kebab menu (right side, only visible on row hover via `group-hover:opacity-100` — matches kasder).
  - For depth > 0: left rule + indent.

- **Per-row click handlers MUST live INSIDE `<CommentNode>`** — not inside `.map()` upstream. Per the engagement-bar-01 lock: `useCallback` inside `.map()` is a hooks-rules violation. Each `<CommentNode>` is `React.memo`'d; click handlers close over its own props. (Reference: [`engagement-bar-01/parts/like-action.tsx`](../../../src/registry/components/data/engagement-bar-01/parts/like-action.tsx).)

### The composer

- **`<CommentComposer>`** — avatar + autosize textarea + send button. Lives at `parts/comment-composer.tsx` and is **publicly re-exported** from `index.ts` for hosts that want it standalone (e.g., a "comment as reply to article" CTA on a news detail page that doesn't render a thread yet).

- **Autosize textarea** — roll our own ~20-LOC hook at `hooks/use-autosize-textarea.ts`. **No `react-textarea-autosize` peer dep.** Mechanism: on `value` change, the hook (i) resets `el.style.height = "auto"` so `scrollHeight` reflects content, (ii) reads `scrollHeight`, (iii) clamps `[minRows * lineHeight, maxRows * lineHeight]`, (iv) writes `el.style.height = clamped + "px"`. Pure DOM mutation in `useLayoutEffect` — no React state, no rerender. **Compiler-safe:** measurement runs in the effect, not during render. Hook is publicly re-exported.

- **Keyboard ergonomics:**
  - **Enter** = submit (if non-empty + not submitting)
  - **Shift+Enter** = newline (textarea default — we don't preventDefault)
  - **Escape** = blur + clear current text in reply mode (matches kasder's reply UX once we add reply mode that kasder lacks)

- **Disabled state:** `currentUser === undefined` → composer is **hidden by default**, replaced by the `composerEmptyState?: ReactNode` slot (typical contents: a sign-in CTA Card). Submitted via the `submitOnEnter?: boolean` (default true) — hosts can flip it off if they want explicit Send-button-only.

- **Reply mode:** clicking "Reply" on any comment opens an **inline ephemeral composer** mounted directly under that comment row (kasder UX expectation). Cancel button + Escape both close the inline composer. Top-level composer at the bottom of the thread is always-rendered (when `currentUser` present); inline reply composer is per-row, ephemeral.

### Realtime subscription

- **`subscribe?: Subscribe<CommentDelta>`** — optional. Identity-stable per host convention (`useCallback` over a stable channel reference). Single subscription for the whole thread (not per-comment).

  ```ts
  export type CommentDelta =
    | { kind: "added";   comment: Comment; parentId?: string }
    | { kind: "edited";  commentId: string; content: string }
    | { kind: "removed"; commentId: string }
    | { kind: "liked";   commentId: string; liked: boolean; count: number };

  export type Subscribe<T> = (handler: (delta: T) => void) => () => void;
  ```

  When `subscribe` prop **identity** changes, the hook re-subscribes (cleanup + re-call). Hosts must memoize.

- **`onSubscribeDelta?: (delta: CommentDelta) => void`** — fires for every delta the subscription emits, regardless of mode. **Uncontrolled mode** (no `comments` prop wins on subsequent renders): deltas patch internal state automatically AND fire this callback. **Controlled mode** (host echoes `comments` prop on every render based on its own store): deltas do NOT mutate internal state; they only fire `onSubscribeDelta`, leaving the host responsible for translating the delta into an updated `comments` prop. Same composability contract engagement-bar-01 set.

- **Tree-walk on delta arrival** — `added` with `parentId` recurses into the tree to attach under the right parent (preserving recursive shape); `edited` walks the tree to patch one node's `content`; `removed` walks the tree and prunes; `liked` walks the tree and flips `isLiked` + `likes`. Pure tree-walk in `useCommentState` reducer.

- **Component does NOT manage transport** — the host owns websocket / SSE / channel; we consume a stream contract.

### Pagination (older comments)

- **`pageSize?: number` (default 10)** — initial render shows up to `pageSize`. If `comments.length === pageSize` AND `onLoadMore` is provided, a "Load older comments" button renders below the thread.

- **`onLoadMore?(page: number): Promise<Comment[]>`** — host returns the next page. Component appends results below; if returned page has `< pageSize`, the load-more button hides.

- **No upward pagination** — newest at top, "load older" at bottom. Symmetric with the optimistic add path (newest comments insert at the top of the list).

- **Per-node reply pagination is out of scope** — if a node has 200 replies and `replyCount > replies.length`, the "view N replies" link only expands what's already in the array. Hosts wanting to lazy-load deeper replies hook into `onLoadReplies?(parentId, page)` — listed under v0.2 candidates.

### Per-comment actions (kebab menu)

- **Default kebab items:**
  - **Delete** — visible only when `currentUser?.id === comment.author.id` (viewer's own comment). Fires `onDeleteComment?(commentId)`. Optimistic — comment is pruned locally immediately.
  - **Report** — always visible. Fires `onReportComment?(commentId)`. No local state change (host opens a dialog / submits silently). If `onReportComment` is omitted, the Report item is hidden.

- **`commentActions?(comment, helpers): CommentMenuItem[]`** — full takeover. Returning `[]` hides the kebab entirely for that comment. `helpers` carries `{ currentUser, isOwn, depth }` so consumers can branch.

  ```ts
  export interface CommentMenuItem {
    label: string;
    onClick?: () => void;
    icon?: ReactNode;
    destructive?: boolean;
    disabled?: boolean;
  }
  ```

  Pure data shape, not Radix nodes — same convention as `engagement-bar-01`'s `EngagementAction`. Component renders the array into Radix `<DropdownMenuItem>`s internally.

- **Kebab visibility** — opacity-0 by default, opacity-100 on row hover. Matches kasder. Fully visible on focus-within for keyboard a11y.

### Optimistic local state + reducer

- **Add comment:** insert locally with `id: temp-${nanoid()}`, fire `onAddComment(content, parentId?)`. If the host returns a `Comment` from the async callback, replace the temp with the returned one (real id wins). If the host returns `void`, the temp comment stays — host's responsibility to update via realtime delta or `comments` prop on next render.

- **Like comment:** flip `isLiked` + `likes` immediately, fire `onLikeComment(commentId, nextLiked)`. Host can revert via `comments` prop or via a realtime `liked` delta with the corrected count.

- **Delete:** prune locally, fire `onDeleteComment(commentId)`. Same revert path.

- **`commentReducer` exported** — for hosts that want to drive their own state machine externally. Accepts `(state, action)` where `action` is a `LocalAction` discriminated union (`add` / `like` / `remove` / `subscribe-delta`). Public from day-1 (per dynamicity primacy: external state coordination is the kind of "add later = breaking change" trap to avoid).

### Slots / render-prop escape hatches

- **`renderNode?(comment, depth, helpers): ReactNode`** — full takeover for the row. `helpers` carries `{ currentUser, isOwn, onLike, onReply, onDelete, onReport, depth }`. Composer below each row (reply mode) is still owned by the thread. Use case: rich per-row UI (mentions highlighted, link previews, embedded media) without forking the thread.

- **`renderViewReplies?(parentId, count): ReactNode`** — past-`maxDepth` "view N replies" link override. Default is the inline-expand link. Override use case: "view N replies →" link that navigates to a detail page rather than expanding inline.

- **`renderComposer?(state, helpers): ReactNode`** — composer takeover. `helpers` carries `{ value, setValue, submit, cancel, parentId, isReply }`. Use case: a host wants to embed a mention picker / emoji popover / file attachment button.

- **`composerEmptyState?: ReactNode`** — sign-in CTA when `currentUser` absent.

- **`emptyState?: ReactNode`** — when `comments.length === 0` AND no realtime is wired, render this in place of the list.

- **`linkComponent?: ElementType`** — for the "view N replies" link in navigate-to-detail mode, host can pass `NextLink` (registry stays portable — no `next/*` import).

### a11y

- Each `<CommentNode>` has `role="article"` + `aria-labelledby={authorNameId}` + `aria-describedby={bodyId}`.
- Composer textarea has `aria-label={labels.composerPlaceholder}` and `aria-busy={isSubmitting}`.
- Like button uses `aria-pressed={comment.isLiked}` (inherited from `engagement-bar-01`'s compact like action).
- "View N replies" toggle uses `aria-expanded` + `aria-controls={repliesContainerId}`.
- Reply / Delete / Report buttons have explicit `aria-label` from `labels`.
- Like count gets `aria-live="polite"` with 300ms debounce (avoids announcing every realtime tick during a flame-war).
- Kebab menu inherits Radix DropdownMenu's a11y (keyboard nav, escape, focus restore).

### i18n labels

- `labels?: CommentThreadLabels` with English defaults:

  ```ts
  export interface CommentThreadLabels {
    composerPlaceholder: string;       // "Write a comment…"
    composerSend: string;              // "Send"
    composerCancel: string;            // "Cancel"
    like: string;                      // "Like"
    unlike: string;                    // "Unlike"
    reply: string;                     // "Reply"
    delete: string;                    // "Delete"
    report: string;                    // "Report"
    viewReplies: (count: number) => string;   // (count) => `View ${count} ${count === 1 ? "reply" : "replies"}`
    loadMore: string;                  // "Load older comments"
    emptyState: string;                // "No comments yet — be the first."
    signInPrompt: string;              // "Sign in to comment"
    formatRelativeTime?: (d: Date, now: Date) => string;
  }
  ```

- `DEFAULT_COMMENT_THREAD_LABELS` exported for spread+override.

- `formatRelativeTime` defaults to a tiny English formatter (matches `expandable-text-01`'s `formatRelativeTime` pattern). Hosts wanting `date-fns` + locale pass it via `labels.formatRelativeTime`. **No `date-fns` peer dep.**

## Out of scope (v0.2 candidates)

- **Edit affordance** — `CommentDelta.edited` is in the v0.1 contract (so future v0.2 won't break realtime), but no UI for editing in v0.1. Defer until a real consumer asks.
- **Mentions / hashtags / link auto-detection** — render via `renderNode?` if a host needs them in v0.1; built-in tag UI lands in v0.2.
- **Voting (up/down)** — kasder is like-only. v0.2 candidate as a `voting?: boolean` flag that swaps the like action for a vote pair.
- **Collapse-by-default per node** — every node renders expanded up to `maxDepth`. v0.2 candidate: `defaultCollapsed?: boolean`.
- **Per-comment subscription** — one subscribe for the whole thread; no per-node subscribe.
- **Animated insert / remove** — CSS-keyframe at most (60ms fade-in on optimistic add); no FM. Story-viewer-01 still gates FM adoption.
- **Lazy-load deeper replies** — `onLoadReplies?(parentId, page)` is a v0.2 consideration; v0.1 trusts `replies` to be fully loaded for visible nodes.
- **Search within thread** — out of scope; consumers wrap their own.
- **Real-time typing indicators** — out of scope.
- **Per-comment edit history view** — out of scope.
- **Comment threading with stable mention links** — out of scope.

## Target consumers

- **`post-card-01`** (sixth ship, next-next) — primary consumer. Forwards `subscribe` / `currentUser` / `commentActions` from the post card down.
- **News article comments** — drop into a news detail page below `<ContentCardNews01>` content body.
- **Event detail page comments** — already-shipped `event-detail-page-01` Tier-3 sandbox is a candidate retrofit.
- **Product reviews** — ratings doublet (out-of-arc) could compose comment-thread-01 underneath as the discussion thread.
- **Document comments** — Notion / Google Docs style annotation threads (one thread per anchor).
- **Photo comments** — story-viewer-01 reactions panel could compose `<CommentThread01 maxDepth={1} variant="compact">`.

## Rough API sketch

Minimal (read-only thread, no composer):

```tsx
<CommentThread01 comments={comments} />
```

With composer + optimistic add:

```tsx
<CommentThread01
  comments={post.comments}
  currentUser={{ id: viewer.id, name: viewer.name, avatar: viewer.avatarUrl }}
  onAddComment={async (content, parentId) => {
    const created = await api.addComment(post.id, { content, parentId });
    return created; // component swaps temp comment for real one
  }}
  onLikeComment={(id, nextLiked) => api.likeComment(id, nextLiked)}
  onDeleteComment={(id) => api.deleteComment(id)}
  onReportComment={(id) => openReportDialog(id)}
/>
```

With realtime + custom kebab + pagination:

```tsx
const subscribe = useCallback<Subscribe<CommentDelta>>(
  (handler) => channel.on("comment", handler),
  [channel]
);

<CommentThread01
  comments={post.initialComments}
  currentUser={viewer}
  maxDepth={2}
  pageSize={10}
  subscribe={subscribe}
  onAddComment={api.addComment}
  onLikeComment={api.likeComment}
  onDeleteComment={api.deleteComment}
  onReportComment={(id) => openReportDialog(id)}
  onLoadMore={(page) => api.fetchComments(post.id, page)}
  commentActions={(comment, { isOwn }) => [
    isOwn && { label: "Pin", onClick: () => api.pinComment(comment.id) },
    isOwn && { label: "Delete", destructive: true, onClick: () => api.deleteComment(comment.id) },
    !isOwn && { label: "Block author", onClick: () => api.block(comment.author.id) },
    { label: "Report", onClick: () => openReportDialog(comment.id) },
  ].filter(Boolean) as DropdownMenuItem[]}
  labels={TR_LABELS}
/>
```

Standalone composer (no thread — e.g., "comment as reply to article" hero CTA):

```tsx
<CommentComposer
  currentUser={viewer}
  placeholder="Share your thoughts…"
  onSubmit={async (content) => api.addArticleComment(article.id, content)}
/>
```

Compact mode for a side rail:

```tsx
<CommentThread01
  variant="compact"
  comments={comments}
  currentUser={viewer}
  maxDepth={1}
/>
```

Full takeover (rich per-row render with mentions):

```tsx
<CommentThread01
  comments={comments}
  currentUser={viewer}
  renderNode={(comment, depth, { onLike, onReply, onDelete }) => (
    <RichCommentRow
      comment={comment}
      depth={depth}
      mentions={parseMentions(comment.content)}
      onLike={onLike}
      onReply={onReply}
      onDelete={onDelete}
    />
  )}
/>
```

## Public exports (from `index.ts`)

```ts
export { CommentThread01 } from "./comment-thread-01";
export { CommentComposer } from "./parts/comment-composer";
export { commentReducer } from "./hooks/use-comment-state";
export { useAutosizeTextarea } from "./hooks/use-autosize-textarea";
export type {
  Comment,
  CommentThread01Props,
  CommentThread01Handle,
  CommentThread01Variant,
  CommentThreadLabels,
  CommentDelta,
  Subscribe,
  Unsubscribe,
} from "./types";
export { DEFAULT_COMMENT_THREAD_LABELS } from "./types";
export { meta } from "./meta";
```

## Open questions for the plan stage

> Q1–Q3, Q6–Q7 from the original draft were signed off during Stage-1 re-validation and are now pre-emptive locks (see below). Q4, Q5, Q8–Q14 still need plan-stage Q-P locks.

1. **`maxDepth` default — 2 or 3?** Twitter is 3, Instagram is 2, Reddit is unlimited. Locked at **2** per [analysis.md](../../migrations/social-posts-system/analysis.md). Past 2, "view N replies" inline-expands. Confirming.

2. **View-N-replies past `maxDepth` — inline-expand or navigate-to-detail by default?** **Inline-expand**, per analysis.md. Hosts wanting navigate-to-detail-page semantics override via `renderViewReplies?` slot. Confirming.

3. **Comment kebab — "Delete" only on viewer's own comments, or always (gated by host)?** **Only own** (viewer.id === comment.author.id) for the **default** kebab. Hosts wanting moderator-style "Delete any" override via `commentActions?(comment, { isOwn, currentUser }) => [...]` and ignore the `isOwn` check. Default is the safe path.

4. **`pageSize` default — 10, 20, or no default?** **10** per analysis.md. (Kasder's `PAGE_SIZE` constant.) The "Load older comments" button only appears when `comments.length === pageSize` AND `onLoadMore` is provided, so it's truly opt-in.

5. **Autosize textarea — `minRows` / `maxRows` defaults?** **minRows = 1, maxRows = 6.** Past 6 rows the textarea internally scrolls. Hosts can override via `composerMinRows` / `composerMaxRows` props on the thread root (NOT on the standalone composer — composer takes them directly). Plan-stage decision: are these on the thread root or only on the composer?

6. **`Subscribe` re-subscribe behaviour on identity change — match engagement-bar-01 (clean teardown + re-call)?** **Yes.** Same pattern. No debouncing. Hosts must memoize via `useCallback`. The hook uses the same passive-ref-mirror trick (`controlledRef` + `onSubscribeDeltaRef` mirrored in passive `useEffect` so the subscription effect re-runs only on `subscribe` identity change).

7. **Reply composer Cancel — clear text only, or also collapse the composer?** **Collapse** (matches kasder's mental model). Cancel hides the inline composer entirely; clicking "Reply" again opens a fresh composer with empty value. Escape inside an open inline composer = same as Cancel.

8. **Component-level `currentUser` shape vs. `engagement-bar-01`-style decoupling?** `engagement-bar-01` doesn't carry a `currentUser` (the user identity is irrelevant to the action row — the host wires `onToggle`). `comment-thread-01` *does* need `currentUser` for (a) composer avatar, (b) "is own comment" check on the default kebab. Open: should the avatar be a separate `composerAvatar?: ReactNode` slot with `currentUser` only used for the isOwn check? **Recommendation: combined `currentUser` prop is fine** — it's the single host-context fact that drives both. Slot-overriding the avatar separately is a v0.2 concern if a real consumer needs it (e.g., persona-switching surfaces).

9. **`onLikeComment` signature — `(id)` or `(id, nextLiked)`?** **`(id, nextLiked: boolean)`** — symmetric with `engagement-bar-01`'s `onToggle(next)`. Component flips local state first, then fires with the new value.

10. **`onLoadMore` naming — keep `onLoadMore` or rename `onLoadOlder`?** Direction is fixed (older at bottom), so `onLoadOlder` is more honest, but `onLoadMore` is the conventional React-pagination name. Plan stage decision.

11. **Tree-walk on delta vs. flat lookup map?** v0.1 uses a recursive tree-walk for delta application (`O(n)` per delta — fine at <1k comments). Plan-stage performance call: stay with tree-walk or build a flat `Map<commentId, { comment, parentId }>` index alongside.

## Pre-emptive locks (from analysis review + engagement-bar-01 carry-over + Stage-1 sign-off)

- **Composer placement: bottom always, slot-overridable.** Single position, predictable scroll. Empty-state slot (`composerEmptyState`) lets hosts suppress / replace the bottom CTA. Hosts that want a top composer render their own and pass `composerEmptyState={null}`. (Stage-1 Q1 lock.)
- **Reply composer is inline ephemeral per-row** (not thread-level swap-target). Matches Twitter / Instagram / kasder; preserves parent context while typing. (Stage-1 Q2 lock.)
- **`onAddComment: (content, parentId?) => Promise<Comment | void>`.** Hosts that have the real comment return it (real id wins for downstream like/delete/edit). Hosts that don't, return `void` and let realtime delta or next `comments` prop patch. (Stage-1 Q3 lock.)
- **Optimistic add insertion: head for top-level, tail for replies.** Newest top-level first (pairs with "Load older comments" at the bottom); replies append chronologically under the parent (top-to-bottom reading order). (Stage-1 Q6 lock.)
- **`currentUser` absent → composer hidden, slot-driven sign-in CTA.** No "visible-but-disabled" mode shipped — hosts that want it build it in the `composerEmptyState` slot themselves. We don't ship two opinions on auth UX. (Stage-1 Q7 lock.)
- **Per-row `<EngagementBar01>` carries `kind: "like"` ONLY.** Reply is a sibling text button; conflating Reply into the bar's `kind: "custom"` would force an icon and re-frame Reply as engagement. (Stage-1 R2 lock.)
- **Per-row `<EngagementBar01>` is ALWAYS in controlled mode.** Thread-level reducer owns `isLiked` + `likes`; bar receives them as props each render and just fires `onToggle`. Avoids race between per-row uncontrolled state and thread-level realtime delta routing. (Stage-1 R3 lock.)
- **`commentActions` returns `CommentMenuItem[]` data shape, not Radix nodes.** Same convention as `engagement-bar-01`'s `EngagementAction`. (Stage-1 R4 lock.)
- **No framer-motion.** Optional 60ms fade-in on optimistic add via CSS keyframe; nothing else animated. Story-viewer-01 still gates FM adoption.
- **No new shadcn primitives required.** `avatar` + `dropdown-menu` + `textarea` + `button` are all already in [`src/components/ui/`](../../../src/components/ui/). No `pnpm dlx shadcn add` needed.
- **Cross-folder imports are allowed (precedent: media-carousel-01 → video-player-01).** Component-level imports of `<ExpandableText01>` and `<EngagementBar01>` from sibling sealed folders. `registry.json` declares `registryDependencies: ["expandable-text-01", "engagement-bar-01"]` so installs auto-pull siblings. Refines the project sealed-folder rule for the second time in the social-posts-system arc.
- **No `react-textarea-autosize` peer dep.** Roll our own ~20-LOC `useAutosizeTextarea` hook. Pure DOM mutation in `useLayoutEffect` — no React state for height, no rerender, compiler-clean.
- **Realtime contract identical to `engagement-bar-01`'s `Subscribe<TDelta>` + `onSubscribeDelta` callback.** Same `controlledRef` + `onSubscribeDeltaRef` mirror pattern in `useCommentState`. Subscription effect re-runs only on `subscribe` identity change.
- **Hybrid controlled/uncontrolled per-field, per-render.** Same pattern as engagement-bar-01: if host echoes `comments` on every render, that's controlled; otherwise component owns local optimistic state. No explicit `controlled: boolean` switch.
- **Per-row click handlers live INSIDE `<CommentNode>` (with `React.memo`), NOT in `.map()` upstream.** Hooks-rules violation if otherwise. Reference: [`engagement-bar-01/parts/like-action.tsx`](../../../src/registry/components/data/engagement-bar-01/parts/like-action.tsx).
- **Refs must not be written during render.** Mirror via passive `useEffect`, same convention as `engagement-bar-01`.
- **`commentReducer` exported from day-1** (per dynamicity primacy: external state coordination is the kind of "add later = breaking change" trap to avoid).
- **`useAutosizeTextarea` exported from day-1** (same rule — non-comment hosts may want autosize behaviour without the thread).
- **`<CommentComposer>` exported standalone from day-1** (same rule — article-page hero CTAs may want composer-only).
- **Composes `expandable-text-01` for body + `engagement-bar-01` `variant="compact"` for per-row actions.** Per-row's compact bar uses 2 actions: `kind: "like"` + `kind: "custom"` (label="Reply", icon=`<Reply />`, onClick=`openInlineComposer`). No share / bookmark / view-count per row.
- **`registry:component` + `target: "components/comment-thread-01/<sub>"`** — locked target convention. Never ship `demo.tsx` / `usage.tsx` / `meta.ts`. Fixtures shipped via separate `comment-thread-01-fixtures` registry item carrying only `dummy-data.ts`.
- **Tailwind v4 translations applied at write-time:** `bg-gradient-to-X` → `bg-linear-to-X`, `break-words` → `wrap-break-word`, `grayscale-[N%]` → `grayscale-N`. (Per-memory: pre-fix during plan to save a lint cycle.)

---

**Stage 1 signed off 2026-05-02.** R1–R5 + Q1/Q2/Q3/Q6/Q7 committed as pre-emptive locks above. Remaining open questions roll into Q-P locks during the plan stage.

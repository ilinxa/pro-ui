# comment-thread — consumer guide

> Stage 3: how to use it. Current for **v0.6.0** (+ the `comment-thread-moderation` and `comment-thread-confirm-delete` add-ons, versioned
> with it).
>
> See [`comment-thread-procomp-description.md`](./comment-thread-procomp-description.md) for what & why,
> [`comment-thread-procomp-plan.md`](./comment-thread-procomp-plan.md) for the original implementation contract, and
> [`comment-thread-loop.md`](./comment-thread-loop.md) for the change contracts (0.4.0, 0.6.0).

## 30-second mental model

`<CommentThread>` is a recursive comment panel with a composer, optimistic updates and realtime. It composes
[`expandable-text`](../expandable-text-procomp/) for long bodies and [`engagement-bar`](../engagement-bar-procomp/)
`variant="compact"` for each row's like (or reaction) action.

Four rules:

1. **`comments` is read once, at mount — unless you pass `onCommentsChange`.** With it, `comments` is controlled: it
   wins on every render, pending operations show over it, and accepted changes are *reported* to you, never applied.
   Without it, push updates with the handle's `reset(next)` / `dispatch(action)` or with realtime deltas.
2. **Realtime is idempotent.** An `added` delta for a comment already on screen never duplicates — including your own
   comment, when the server's broadcast beats `onAddComment`. Send the `clientId` the thread gives you and echo it back
   for exact matching.
3. **Handlers may return promises.** The change shows at once; a rejection rolls it back and calls `onError`. Nothing
   leaks as an unhandled rejection.
4. **`currentUser` absent → composer hidden.** Use `composerEmptyState` for a sign-in CTA.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/comment-thread
# optional: inline edit, tombstones, pinned marker
pnpm dlx shadcn@latest add @ilinxa/comment-thread-moderation
# optional: confirm before delete (adds shadcn's alert-dialog)
pnpm dlx shadcn@latest add @ilinxa/comment-thread-confirm-delete
# optional: the demo's sample data
pnpm dlx shadcn@latest add @ilinxa/comment-thread-fixtures
```

The base pulls `expandable-text` and `engagement-bar` plus the shadcn primitives `avatar`, `button`, `dropdown-menu`,
`textarea`. The moderation add-on pulls the base. No `react-textarea-autosize`, `date-fns` or `framer-motion`.

Size: the base installs ~177 KB (much of it JSDoc in `types.ts`); `<CommentThread>` costs ~13.7 KB minified + gzip
in your bundle (a read-only `CommentThreadRoot` + `CommentThreadList` ~11.5 KB, the reply box loading on first use;
0.3.2: ~5 KB). The moderation add-on is ~6.6 KB, the confirm-delete add-on ~5 KB.

## Minimal usage

```tsx
import { CommentThread } from "@/components/comment-thread";

<CommentThread comments={post.comments} />
```

Read-only: no composer (no `currentUser`), no callbacks.

## Posting, liking, deleting — with rollback

```tsx
<CommentThread
  comments={post.initialComments}
  currentUser={{ id: viewer.id, name: viewer.name, avatar: viewer.avatarUrl }}
  onAddComment={(content, parentId, options) =>
    api.addComment(post.id, { content, parentId, clientId: options?.clientId }) // return the created Comment
  }
  onLikeComment={(id, liked) => api.likeComment(id, liked)}      // a promise → rolls back on reject
  onDeleteComment={(id) => api.deleteComment(id)}                // a promise → restored on reject
  onReportComment={(id) => openReportDialog(id)}
  onError={(error, { kind }) => toast.error(kind)}
/>
```

- **Posting.** A pending comment appears at once (head of the list; replies at the end of their parent) with a
  temporary id and a `clientId`. While it is pending, its like / reply / delete are disabled, Edit is not offered,
  and its time reads `labels.sending` — **the built-in actions never hand its temporary id to your handlers** (nor do
  the `renderNode` helpers); your own slots get `helpers.isPending`. Without `onAddComment` a posted comment is a
  local comment and keeps its local id.
  - Resolve with the created `Comment` → it replaces the pending one (keeping any replies).
  - Reject → the pending comment is removed, the composer keeps the text and shows `labels.postFailed`
    (`role="alert"`), `onError(error, { kind: "add", commentId: tempId, parentId })`.
  - Resolve with nothing → uncontrolled: the pending comment stays (actions disabled) until a delta or `reset` brings
    the real one; controlled: it is removed (your `comments` prop is the truth).
- **Like / reaction / delete / edit.** Shown at once. A rejected promise rolls back (a deleted comment comes back at
  its position) and calls `onError`. Only the latest request per comment decides — an older one settling late never
  overrides a newer one.
- **`optimistic={false}`**: no pending row (the comment appears once the server returns it); likes and deletes wait
  for their promise.

## Controlled mode

```tsx
const [comments, setComments] = useState<Comment[]>(initial);

<CommentThread
  comments={comments}
  onCommentsChange={(next, change) => setComments(next)}
  currentUser={viewer}
  onAddComment={api.addComment}
  onLikeComment={api.likeComment}
/>
```

`onCommentsChange(next, change)` is called **once a change is accepted**: after the handler's promise resolves, at
once for a like / reaction / delete / edit handler that returns nothing, and at once for realtime deltas, loaded
pages / replies and handle calls. A post whose `onAddComment` returns nothing is not reported — the pending comment is
removed and your `comments` (or a delta) brings the real one.
`next` is the change applied to your current `comments`. While a promise is in flight the change is an overlay over
your prop; a rejection drops it and reports nothing, so you never have to revert. A refetch that replaces `comments`
replaces stale optimism too. `change` is a `CommentsChange`
(`added` · `liked` · `reacted` · `deleted` · `edited` · `page` · `replies` · `delta` · `dispatch`).

Development warnings: `comments` changing identity while uncontrolled (pass `onCommentsChange`, or a stable array),
and switching modes after mount.

## Realtime

```tsx
const subscribe = useCallback<Subscribe<CommentDelta>>(
  (handler) => channel.on("comment", handler),
  [channel],
);

<CommentThread comments={initial} currentUser={viewer} subscribe={subscribe} />
```

```ts
type CommentDelta =
  | { kind: "added"; comment: Comment; parentId?: string }
  | { kind: "edited"; commentId: string; content: string }          // also sets edited: true
  | { kind: "removed"; commentId: string }                          // prunes (or tombstones, see moderation)
  | { kind: "liked"; commentId: string; liked: boolean; count: number | null }
  | { kind: "state"; commentId: string; state: CommentState }
  | { kind: "reacted"; commentId: string; reactions: CommentReactions };
```

- **Memoize `subscribe`** — a new identity tears the subscription down and re-subscribes.
- **Idempotent:** an `added` delta whose id is already in the tree changes nothing; one whose id is new but whose
  `comment.clientId` matches a pending comment replaces that pending comment. Match = id first, then `clientId`.
- An `added` delta for an unknown `parentId` is dropped (one development warning).
- Controlled mode: deltas are reported (`{ kind: "delta" }`), not applied.

## Pages and replies

```tsx
<CommentThread
  comments={firstPage.items}
  nextCursor={firstPage.nextCursor}
  onLoadMoreCursor={(cursor) => api.comments(post.id, { cursor })}  // → { items, nextCursor, hasMore? }
  onLoadReplies={(commentId, cursor) => api.replies(commentId, { cursor })}
/>
```

- **Top level.** `onLoadMoreCursor(cursor)` wins over the legacy `onLoadMore(page)`. An explicit `hasMore` wins on
  every render (the button still needs a loader); `nextCursor` applies with `onLoadMoreCursor`. Legacy heuristic: "Load more" shows while the thread holds at least
  `pageSize` top-level comments and the last page was full — recomputed as the list changes (so an async first load
  works). Loading shows `labels.loadingMore` and keeps focus on the button; a failure shows `labels.loadFailed` with
  `labels.retry`. Pages are deduped by id.
- **Replies.** A "View N replies" link shows when `onLoadReplies` is wired and `replyCount` is larger than the
  loaded replies or `comment.repliesCursor` is set (or when loaded replies are hidden past `maxDepth`). The first cursor is `comment.repliesCursor ?? null`.
  Per-comment loading (`labels.loadingReplies`), failure (`labels.loadRepliesFailed` + Retry), and
  `labels.moreReplies` while more exist.

## Permissions and the actions menu

```tsx
const comment: Comment = {
  /* … */
  permissions: { canDelete: true, canReply: false },   // each defined key beats the default
};

<CommentThread
  comments={comments}
  currentUser={viewer}
  extraActions={(comment, { permissions, isPending }) => [
    { label: "Pin", hidden: !permissions.canPin, disabled: isPending, onClick: () => api.pin(comment.id) },
    { label: "Copy link", separatorBefore: true, onClick: () => copy(comment.id) },
  ]}
/>
```

Defaults: `canDelete` / `canEdit` = the viewer wrote it; `canReply` = signed in (and the thread is not `closed`); `canReact` = `true` (false → the action
renders disabled); `canReport` = the viewer did **not** write it (and `onReportComment` is wired); `canPin` / `canHide`
= `false` — they gate nothing built in; read them in your own items. `extraActions` items are appended after the
defaults; `commentActions` still takes the whole menu over (both receive `CommentActionHelpers`: `currentUser`,
`isOwn`, `depth`, `permissions`, `isPending`, and since 0.6.0 `onDelete`). Menu items take `hidden`, `disabled`, `destructive`, `separatorBefore`;
a menu whose items are all hidden is not rendered.

## Reactions per row

```tsx
<CommentThread
  comments={comments}          // Comment.reactions: { viewerReaction, counts, totalCount }
  reactionKinds={[{ key: "love", icon: <Heart />, label: "Love" }, { key: "laugh", icon: "😂", label: "Haha" }]}
  onReactComment={(id, kind) => api.react(id, kind)}   // kind = null clears
/>
```

With both props each row's action is an engagement-bar reaction picker; a rejected promise rolls the reaction back.
Without them the row shows the like (`likes: null` withholds the count — no number, nothing in the accessible name).
`engagementActions(comment, helpers)` builds the row's actions yourself (`helpers.defaultActions` is the default).

## Moderation add-on (`comment-thread-moderation`)

```tsx
import { commentModeration } from "@/components/comment-thread/features/moderation";

<CommentThread
  comments={comments}
  currentUser={viewer}
  moderation={commentModeration}
  removedMode="tombstone"
  onEditComment={(id, content) => api.editComment(id, content)}
/>
```

- **Inline edit:** an Edit item (`labels.edit`) for comments with `permissions.canEdit` (default: your own), not while
  pending. Save applies the content (`edited: true`) at once; a rejection restores it and shows `labels.editFailed`.
- **Tombstones:** a comment whose `state` is `"hidden"`, `"deleted"` or `"removed"` renders `labels.tombstone(state)`
  in its place, and **its replies stay**. `removedMode="tombstone"` turns a `removed` delta into state `"removed"` (and
  your own delete into `"deleted"`).
- **Pinned:** `isPinned` shows `labels.pinned` beside the author's name.
- **Without the add-on:** `onEditComment` → one development warning, no Edit item; `removedMode="tombstone"` → one
  warning, removals prune; a non-visible comment is left out **with its replies** (one warning); `isPinned` is ignored.
- The seam is public: pass your own `CommentModerationExtension` (`{ EditComposer, Tombstone, PinnedMarker }`).

## Labels, locale and time

```tsx
<CommentThread
  locale="tr"
  timeZone="Europe/Istanbul"
  labels={{
    composerPlaceholder: "Yorum yaz…",
    reply: "Yanıtla",
    viewReplies: (n) => `${n} yanıtı gör`,
    kebabAriaLabel: (name) => `${name} için işlemler`,
    replyTo: (name) => `${name} adlı kişiye yanıt`,
    postFailed: "Yorum gönderilemedi.",
  }}
  {...rest}
/>
```

- Every string is a label; a string with a value is a function (`viewReplies(count)`, `kebabAriaLabel(name)`,
  `replyTo(name)`, `tombstone(state)`). `defaultCommentThreadLabels` has the English defaults; an `undefined` value
  keeps the default.
- **Time:** `locale` (default `"en"`) and `timeZone` build the default formatter — English stays "Just now" / "5m" /
  "2h" / "3d" / "2w" / "March 5"; other locales use `Intl.RelativeTimeFormat` ("5 dk. önce"). Replace it with the
  `formatRelativeTime` prop (`createRelativeTimeFormatter(locale, timeZone)` is exported). A comment stamped ahead of
  the viewer's clock reads as now.
- **"now":** pass `now` to render relative times immediately (and deterministically). Without it the thread reads the
  clock after mount and every minute — the server and the first client render show no relative text, so they agree.
- `formatCount` formats like / reaction counts (default compact `Intl.NumberFormat(locale)`); `dir` sets the reaction
  pickers' arrow keys and the direction of the portaled actions menu (default: read after mount).
- Replies indent with `padding-inline-start`, so they mirror under `dir="rtl"`.

## Standalone composer

```tsx
import { CommentComposer } from "@/components/comment-thread";

<CommentComposer
  currentUser={viewer}
  onSubmit={async (content) => api.addArticleComment(article.id, content)}
  labels={{ postFailed: "Couldn't post." }}
  onError={(error) => log(error)}
/>
```

A rejected `onSubmit` keeps the text and shows `labels.postFailed` under the box (style it with `errorClassName`); it
is never re-thrown. `value` + `onChange` make the text controlled (story-viewer's reply box does this).

## Slots

- `renderNode(comment, depth, helpers)` — replaces the row, its actions menu included (build your own from
  `helpers`); the thread keeps the tree below it: the reply composer, the replies (each through `renderNode`) and the
  "view / more replies" links. `helpers` carries `permissions` and `isPending`; its `onLike` / `onReply` / `onDelete`
  do nothing while pending. (Before 0.4.0 the replies under a `renderNode` row were not rendered.)
- `renderViewReplies(parentId, count)` — replaces the inline-expand link shown at `maxDepth`; the on-demand
  `onLoadReplies` link stays built in.
- `renderComposer(state, helpers)` — replaces the bottom composer. `helpers.submit` never rejects; a failure sets
  `state.hasError` and keeps `state.value`.
- `composerEmptyState` — shown instead of the composer without `currentUser` (`null` hides it).
- `emptyState` — shown for an empty thread with no realtime.

## Imperative handle

```ts
interface CommentThreadHandle {
  focusComposer(): void;
  openReply(parentId: string): void;
  getCurrentComments(): Comment[];      // the shown tree (overlay applied)
  reset(next: Comment[]): void;         // controlled: reported
  dispatch(action: CommentLocalAction): void; // controlled: reported
  deleteComment(commentId: string): void; // 0.6.0: the built-in delete path, without confirmDelete
}
```

`commentReducer` and `useCommentState` stay exported for hosts that run their own store.

## Accessibility

- Each comment is an `<article aria-labelledby>`; the actions menu is named `labels.kebabAriaLabel(name)`; the inline
  reply box `labels.replyTo(name)`.
- Busy controls (Send, Load more, Retry) use `aria-disabled` so focus stays on them; the textarea is read-only while
  a post is in flight.
- Failures are announced (`role="alert"`). The kebab shows on hover, focus-within and coarse pointers.
- After an inline reply is sent or cancelled, focus returns to the comment's Reply button.

## 0.6.0 — parts, auto-load, confirm before delete, touch size

Additive. `<CommentThread>` renders exactly as in 0.5.0 (except the "(edited)" contrast fix below); everything new is
opt-in. `CommentActionHelpers` gains a required `onDelete` — only a helpers object you build yourself (a test, a
wrapper) needs updating. Needs engagement-bar 0.8.0 (installed with it).

### Compose your own layout

`CommentThread` is now `CommentThreadRoot` + `CommentThreadList` + `CommentThreadLoadMore` + `CommentThreadComposer`.
Use the parts for layouts the assembly can't do — the in-place comments panel under a feed card, with a height-capped
list that loads as you scroll and the write box always visible:

```tsx
import {
  CommentThreadRoot,
  CommentThreadScrollArea,
  CommentThreadList,
  CommentThreadLoadMore,
  CommentThreadComposer,
} from "@/components/comment-thread";

<CommentThreadRoot comments={comments} onCommentsChange={…} currentUser={me} onLoadMoreCursor={…} hasMore={hasMore}
  nextCursor={cursor} className="gap-0">
  <CommentThreadScrollArea className="max-h-96 px-4">
    <CommentThreadList />
    <CommentThreadLoadMore mode="auto" />
  </CommentThreadScrollArea>
  <CommentThreadComposer className="border-t border-border p-3" />
</CommentThreadRoot>
```

- **`CommentThreadRoot`** takes every `CommentThread` prop (and the `ref` handle) and holds all state; the parts read
  it from context and throw if used outside it. Its `className` is the thread's root `<div>` (`flex flex-col gap-3`).
- **`CommentThreadScrollArea`** — a `<div>` that scrolls vertically, is focusable (`tabIndex={0}`) and is a named
  region (`aria-label`, else `labels.commentsRegion`, default "Comments"), so keyboard users can scroll it. It works
  outside a root too (post-card wraps its whole inline thread in one).
- **`CommentThreadLoadMore mode="auto"`** loads the next page when the button nears the visible edge of the enclosing
  scroll area (else `scrollRoot`, else the viewport; `rootMargin` default `"0px 0px 200px 0px"`). One request at a
  time; after a short page that leaves the button visible it loads again — once the page is in the list, so a
  controlled host that applies it late is never asked twice for the same page; a page that adds no comments stops
  auto-loading (the button still loads); a failed page is **not** retried automatically (the Retry button stays); the button stays for keyboard users; a polite status says
  `labels.loadingMore` while loading. Default `mode="button"` is today's button.
- **`CommentThreadComposer`** — the bottom composer (or the closed notice, `renderComposer`, `composerEmptyState`).
  Its `className` styles only the bottom composer (`composerClassName` still reaches every inline reply box); with a
  `className` it renders a wrapper `<div>`, without one it adds no element. Placed after the scroll area it needs no
  `sticky`, so it never overlaps the last row.
- Without a `CommentThreadComposer`, `handle.focusComposer()` does nothing and says so once in development.
- **`useCommentThread()`** inside a root returns `{ comments, hasMore, loadingMore, loadMoreFailed, loadMore, closed,
  currentUser, labels }` for your own parts (a count header, your own sentinel).
- **A read-only list** — `CommentThreadRoot` + `CommentThreadList` with no composer part — leaves the composer code out
  of the first load: the rows load the reply box the first time someone presses Reply. With the composer part
  mounted, reply boxes open at once, as before.

The request asked for `loadMoreMode` / `composerPlacement` / `maxHeight` props; the parts give the same result
(`mode="auto"`, the composer after the scroll area, a `max-h-*` class on the scroll area) without three more props on
the assembly.

### Confirm before delete (`confirmDelete`)

```tsx
import { commentDeleteConfirm } from "@/components/comment-thread/features/confirm-delete";

<CommentThread
  confirmDelete={commentDeleteConfirm}
  labels={{
    deleteTitle: "Yorum silinsin mi?",
    deleteBody: (hasReplies) => (hasReplies ? "Yanıtları da silinecek." : "Bu geri alınamaz."),
    deleteConfirm: "Sil",
    deleteCancel: "Vazgeç",
  }}
/>
```

- Install the add-on with `pnpm dlx shadcn@latest add @ilinxa/comment-thread-confirm-delete` (it adds shadcn's
  `alert-dialog`; the base never imports it). Or pass your own function:
  `confirmDelete={async ({ comment, hasReplies }) => myConfirm(…)}` — `true` deletes, `false` (or a rejection) keeps
  the comment.
- It covers deletes started from the row's menu: the built-in Delete item, and `helpers.onDelete` — now in every
  helper bag (`commentActions`, `extraActions`, `engagementActions`, `renderNode`), so your own menu items get the
  confirmation, `onDeleteComment`, optimistic removal, rollback and `onError` (unlike `handle.dispatch`).
  `handle.deleteComment(id)` deletes through the same path **without** asking.
- Cancel returns focus to the row's actions menu trigger; a confirmed delete moves it to the neighbouring row (or the
  composer), as an unconfirmed delete does — also when the thread sits inside your own dialog or bottom sheet. One
  request waits at a time: asking again for the same comment is ignored, a request for another comment supersedes it
  (the earlier answer is ignored), and a request whose comment disappears (a realtime delete) is dropped. Your function
  should settle; one that never does leaves only that comment waiting.
  `hasReplies` is true when the comment has loaded replies or a `replyCount` above 0 (with the default `"prune"`
  they go too).

### Touch size (`size="touch"`)

`size="touch"` gives every control — the rows' engagement bars, Reply, the actions menu trigger (always visible in
this size), the author-name link, "Show more", "View replies", "Load more", the composers' Send / Cancel, the moderation add-on's edit box — a
hit area of at least 44 × 44 px; the composer field is at least 44 px tall so Send sits inside it. `CommentComposer` takes `size` on its own too.

### Fixes

- When the last page arrives and "Load older comments" goes away, focus moves to the first new comment — now also when
  a controlled host applies the page after the promise resolves (it used to give up), and never if you moved focus
  elsewhere first. While more pages remain, focus stays on the button, as before.
- The "(edited)" suffix uses the full muted-foreground colour (it was 80 %, 4.25–4.48:1 in light mode); every row
  meta text now reads above 6.7:1 in both themes.

## 0.5.0 — rich bodies, labels everywhere, author links, closed threads

Additive; without the new props the only changes are the markup / accessibility fixes listed below. Needs
expandable-text 0.3.0 or later (installed with it).

- **`renderContent(comment, { depth })`** — render the body yourself (links, mentions, hashtags) and keep the line
  clamp and "Show more". The result renders inside the row's expandable-text, which re-measures when it changes and
  when the comment's `content` changes. Return safe markup: the thread renders it as given. The moderation add-on's
  edit box still edits the raw `content`.
- **Labels reach every row.** `labels.showMore` / `showLess` name the clamp control; nested `labels.engagement` (any
  `EngagementBarLabels` key) names the row actions — the reaction picker and any comment / share / bookmark / view-count
  action you add with `engagementActions`. The thread's own `like` / `unlike` keys win over `engagement.like` /
  `engagement.unlike`. Avatar initials use `locale`.
- **Author links** — `getAuthorHref(author, comment)` + `linkComponent` (default `"a"`, receives `href`), as in
  post-card: the avatar link is hidden from assistive technology and the keyboard, the name link is the one announced.
  With or without links, the name is isolated (`<bdi>`) and the `@handle` stays left-to-right inside a right-to-left
  page.
- **`closed`** — no bottom composer (`labels.closed`, default "Comments are turned off.", renders in its place and
  `renderComposer` is not called), no Reply, open reply boxes close, `handle.openReply` / `focusComposer` do nothing
  (one development warning); the `renderNode` helpers' `onReply` does nothing either. Likes and menus are unchanged.
  Closing an open thread drops a half-typed draft in the default composer, and the notice is plain text (not
  announced) — tell users yourself if the thread closes while they read it.
- **Fixed:** "View replies" reports its real `aria-expanded` and sets `aria-controls` only while the replies list is
  rendered; expanding past `maxDepth` moves focus to the first revealed reply instead of dropping it.

## Migration 0.3 → 0.4

- **`Comment.likes` is `number | null`.** Code that does arithmetic on `likes` needs a null check.
- **Report no longer shows on your own comments** (default `canReport`). Set `permissions.canReport: true` to keep it.
- **"View N replies" now shows when `replyCount` > loaded** and `onLoadReplies` is wired; before, nothing showed until
  replies were loaded.
- **"Load more"** no longer requires the first page to be exactly `pageSize` long.
- **Relative times render after mount** (or immediately with `now`) — fixes hydration mismatches.
- `onAddComment` receives a third argument `{ clientId }`; `onLikeComment` / `onDeleteComment` may return promises.
- `DEFAULT_COMMENT_THREAD_LABELS` → `defaultCommentThreadLabels` (the old name stays as a deprecated alias);
  `labels.formatRelativeTime` → the `formatRelativeTime` prop (still honoured).
- `CommentMenuItem` gains `hidden`; `CommentNodeHelpers` / `CommentComposerState` gain fields (additive).

## Not implemented

- Built-in mention / hashtag parsing (render them with `renderContent`), up / down voting, per-comment subscriptions, animated
  insert / remove, search within a thread.
- A reply to a pending comment is blocked until it is confirmed (not queued).

# Loop state — `comment-thread` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** under 0.x, with documented behaviour changes for bug fixes; additive API) |
| **Current stage** | U1 — **awaiting sign-off** (Part 3 proposal) |
| **Sign-off policy** | user-interactive (composed by post-card → any break is always the user's call). Ask before every push. |
| **Version target** | v0.3.2 → **v0.4.0** |
| **Model roster** | architect: main session · intake: 1 × Sonnet 5 (read-only) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.6 CT1–CT6 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1157-1255`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md` §Part 3 "post-card / comment-thread").

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — sign-off: pending
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship

## U0 — Intake

Not in `closed`. Baseline 4 rows: clock `comment-thread.tsx` (`Date.now()` temp id), `lib/format-time.ts`
(`new Date()` default param), `parts/comment-node.tsx:209` (`new Date()` in render); jsx-literal `parts/comment-kebab.tsx`
(`Comment actions for`). One test file. Built 53.9 KB / budget 60.

| Item | Code today | Verdict |
|---|---|---|
| CT1 controlled `comments` | `comments` renamed `initialComments` (`comment-thread.tsx:43`), read once by `useReducer` (`hooks/use-comment-state.ts:176-179`) | confirmed |
| CT1+ duplicates | `add`, `added` delta and `append-page` never check for an existing id (`use-comment-state.ts:78-83`, `:119-124`) | confirmed |
| CT1+ own-post race (architect, by reading) | the server's `added` echo can arrive before `onAddComment` resolves; then `swap-temp` turns the temp into a second copy of the same id (duplicate rows and keys). `swap-temp` also drops replies added under the temp | confirmed by reading; to be reproduced in a test at U2 |
| CT2 reply loading | the link needs loaded replies: `totalReplies = replies?.length` gates `hiddenAtBoundary` (`comment-node.tsx:164-170`), so `replyCount: 3` with no loaded replies shows **no link** | confirmed, worse than requested |
| CT2 paging | `hasMore` computed once at mount (`comment-thread.tsx:97`: `initialComments.length === pageSize`), then `result.length === pageSize` (`:284`); `try/finally` without `catch` → unhandled rejection | confirmed: a first page of a different size, or an async first load, never shows "Load more"; an exact last page shows a dead button |
| CT3 failed post | temp added, `await onAddComment`, no catch, no removal (`:182-186`, replies `:245-249`); composer text is kept (`parts/comment-composer.tsx`) but the rejection escapes `void submit()` | partial (text kept; temp, unhandled rejection, error message missing) |
| CT3 delete / like rollback | local dispatch then `void` handler calls (`:122-136`) | confirmed |
| CT3 temp id reaches the server | a temp row shows Delete / Like / Reply; all three send the temp id | confirmed |
| CT4 permissions, state, pin, edit | `Comment` has `edited` only; ownership = `currentUser.id === author.id`; Report shows on own comments; `commentActions` is takeover-only; no edit UI; `removed` delta and delete prune the whole subtree (`pruneById`) | confirmed |
| CT5 reactions per row | one hard-coded like action (`comment-node.tsx:219-229`); engagement-bar already supports reaction, `null` counts, hidden / disabled, promise rollback | confirmed |
| CT6 strings / time / indent | `Comment actions for ${name}`, `Reply to ${name}`, `` `${labels.loadMore}…` ``, English composer fallbacks; `lib/format-time.ts` English months + "Just now" / "m" / "h" + local-TZ getters; inline `paddingLeft` (`comment-node.tsx:178`) | confirmed |

**Blast radius:** post-card (imports `CommentThread`, `CommentThreadHandle`, `defaultRelativeTime`, `toDate`, many types;
passes `comments={commentThread ?? []}` and `onLoadMore={onLoadMoreComments}`) · story-viewer (`CommentComposer` +
handle in `parts/reply-composer.tsx`, and inline-copied comment types) · news-card / event-card / blackboard / post-card
(`CommentMenuItem` shape) · engagement-bar (composed per row). No feature slices. Owed from the v0.2.0 spotcheck:
F-02 (JSDoc on `patch-content` not flipping `edited`), F-03 (kebab ignores `separatorBefore`): both taken.

## U1 — Change contract (proposed)

**Rule:** nothing breaks for existing callers; post-card keeps compiling unchanged. New behaviour is opt-in except the
bug fixes marked "fix".

- **CT1 controlled:** keep `comments`; add `onCommentsChange?(next, change)`. Controlled **iff `onCommentsChange` is
  passed**: then `comments` wins every render and local mutations are reported, not applied (story-rail model).
  Pending optimistic operations are an overlay derived over the prop, so a refetch replaces stale optimism. Without
  it: today's read-once. `ref.reset` / `dispatch` keep working (reported in controlled mode). Dev-warn when `comments`
  changes identity while uncontrolled.
- **Idempotence (fix):** `add` / `added` / `append-page` skip or merge ids already in the tree. A delta with an unknown
  `parentId` is dropped with a dev-warn. Optional `Comment.clientId`: `onAddComment(content, parentId, { clientId })`
  (extra argument) lets the server echo it, and an `added` delta carrying a pending temp's `clientId` reconciles
  instead of duplicating. `swap-temp` keeps replies attached to the temp, and removes the temp if the real id already
  arrived.
- **Pending rows (fix):** while a comment is pending, Delete / Like / Reply are disabled with `labels.sending`. No temp
  id ever reaches a handler.
- **CT3 rollback:** `optimistic?: boolean` (default `true`). Rejected `onAddComment` → temp removed, composer keeps the
  text, `labels.postFailed` (`role="alert"`), `onError?(error, { kind })`. `onLikeComment` / `onDeleteComment` may return
  a promise; on reject the like state or the removed subtree (at its position) comes back. Latest-wins per target. No
  unhandled rejections (load more, composer submit). A `void` result keeps today's temp, except in controlled mode
  (the prop or the delta is the truth there).
- **CT2 paging:** `onLoadMoreCursor?(cursor) => Promise<{ items, nextCursor, hasMore? }>` beside the unchanged
  `onLoadMore(page)`. Explicit `hasMore?` / `nextCursor?` props win every render. The legacy heuristic becomes
  `length >= pageSize`, recomputed as the list changes (fix). Replies: `onLoadReplies?(commentId, cursor)`; the "view N
  replies" link shows whenever `replyCount > loaded` (fix), with per-node loading, Retry on failure, and "more
  replies" while `nextCursor` is set.
- **CT4 moderation:** `Comment.permissions?` (`canEdit`, `canDelete`, `canPin`, `canHide`, `canReply`, `canReact`,
  `canReport`; each defined key beats the ownership heuristic). `Comment.state?: "visible" | "deleted" | "hidden" |
  "removed"` renders a labelled tombstone that keeps its replies, a `{ kind: "state" }` delta, and
  `removedMode?: "prune" | "tombstone"` (default `"prune"` = today). `Comment.isPinned?` with a pinned marker. Inline
  edit through `onEditComment?(id, content)` (reuses the composer, rollback on reject, sets `edited`).
  `CommentMenuItem.hidden?`, `extraActions?(comment, helpers)` appended to the defaults, `commentActions` stays a
  takeover; kebab honours `separatorBefore` (F-03).
- **CT5 reactions:** `engagementActions?(comment, helpers)` builds the row's engagement-bar actions (default = today's
  single like). `Comment.likes?: number | null` (`null` hides the count).
- **CT6:** label functions `kebabAriaLabel(name)`, `replyTo(name)`, plus `loadingMore`, `sending`, `postFailed`,
  `retry`, `loadingReplies`, `tombstone`, `pinned`, `edit`, `save`. The "…" concatenation goes. English defaults
  unchanged. `locale?` (default `"en"`), `now?` (captured once on mount), `timeZone?`. The default formatter keeps the
  exact English output for `en` and uses `Intl.RelativeTimeFormat` / `DateTimeFormat` otherwise.
  `defaultRelativeTime(date, now)` and `toDate` keep their signatures (post-card imports them). Indent via
  `paddingInlineStart`.
- **Tests (C11):** `describeContract`, `locale="tr"` + hydration, RTL demo, axe; each fix reproduced first (duplicate
  delta, own-post race, temp id to handlers, reply link, `hasMore` cases, unhandled rejections, rollback). Falsify all.

### Invariants

| # | Invariant |
|---|---|
| I1 | no new props → today's output in LTR (except the fixes: reply link visible, correct "Load more", no duplicates) |
| I2 | read-once mode without `onCommentsChange`; handle methods and their signatures |
| I3 | exports `commentReducer`, `useCommentState`, `CommentComposer` (+ handle), `defaultRelativeTime`, `toDate` unchanged; `renderComposer` helpers contract |
| I4 | `CommentMenuItem` and `Comment` additive only (four components import them) |
| I5 | no `asChild`; direct `DropdownMenuTrigger` |

### Size

53.9 KB / 60; estimate +25 KB source → **~75–82 KB**. Budget → **85**, or ship CT4 moderation (edit, tombstones, pin)
as a feature item to keep the base near 62 KB. Question 5.

### Open questions (in the proposal)

1. Controlled when `onCommentsChange` is passed (recommended; keeps post-card and today's callers working)?
2. Paging: a new cursor callback beside the page one (recommended) or replace it (breaking, post-card in lockstep)? Do
   their APIs return cursors for top-level and replies?
3. Does their WebSocket echo the sender's own `added` event, and can it echo a `clientId`?
4. Keep pruning on `removed` (recommended), with tombstones opt-in?
5. Budget 85 KB, or moderation as an add-on?
6. Reactions per comment, or like with a nullable count for now?

## Parked

- post-card passes `comments={commentThread ?? []}` (a fresh array every render); matters once post-card forwards the
  controlled pair (post-card loop).
- `showEmpty` is false forever for live threads (`subscribe` set); revisit with controlled mode.
- story-viewer inline-copies comment types; keep structurally compatible.

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- **Echo:** their broadcast includes the sender's own socket, so the echo can beat `onAddComment` → idempotent handling is required (as planned).
- **clientId:** not echoed today; they add it (accept on create, echo in the broadcast) when they adopt 0.4.0. **Match on the comment id first, then `clientId` when present.**
- **Cursors:** yes for top-level (sorts newest / oldest / top) and per-comment replies; `hasMore` / `nextCursor` fit.
- **Moderation → add-on** (changes the contract — see the U1 amendment below). The plain thread renders under every feed post and must stay small.

### U1 amendment (2026-10-25, platform reply) — moderation as a feature item

Per `docs/feature-slicing-convention.md` (the `media-editor-capture` pilot):

- **New item `comment-thread-moderation`** (`features/moderation/`, `meta: { featureOf: "comment-thread", budgetKB }`,
  regDeps `@ilinxa/comment-thread` + the primitives its files import). It carries **inline edit** (edit composer +
  rollback), **tombstones** (`Comment.state` rendering that keeps replies; `removedMode="tombstone"`) and **pin** (pinned
  marker). Exported ready value `commentModeration`.
- **Base seam** `hooks/use-moderation-extension.ts` (type + `createContext(null)` + optional accessor) and ONE prop
  `moderation?: CommentModerationExtension`. Feature components travel inside the context value; no base file imports
  a feature file. Consumers may inject their own implementation.
- **Stays in the base:** the data types (`Comment.state?`, `isPinned?`, `permissions?`), the `{ kind: "state" }` delta in
  the reducer, per-comment `permissions`, `hidden` / `extraActions`, idempotence, rollback, paging, reactions,
  labels, locale.
- **Negative path (tested):** without the add-on — `onEditComment` or `removedMode="tombstone"` → ONE dev-warn, no edit
  item, removals prune (today's behaviour); a comment whose `state` isn't `"visible"` is pruned with its replies
  (today's `removed` semantics) plus one dev-warn; `isPinned` is ignored.
- **Size:** base ~70 KB (budget 60 → **75**); moderation item ~8 KB.
- **clientId rule:** reconcile by comment id first, then by `clientId` when present.

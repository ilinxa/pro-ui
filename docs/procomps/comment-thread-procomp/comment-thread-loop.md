# Loop state — `comment-thread` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** under 0.x, with documented behaviour changes for bug fixes; additive API) |
| **Current stage** | U1 signed (scope: platform 2026-10-25) — U2 starts on the user's go for its release |
| **Sign-off policy** | user-interactive (composed by post-card → any break is always the user's call). Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.3.2 → **v0.4.0** |
| **Model roster** | architect: main session · intake: 1 × Sonnet 5 (read-only) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.6 CT1–CT6 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1157-1255`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md` §Part 3 "post-card / comment-thread").

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** platform 2026-10-25 (`PROUI_REPLY_2026-10-25_PART3.md`); the user's go is given per release (order in the platform reply)
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
- **CT4 permissions (base):** `Comment.permissions?` (`canEdit`, `canDelete`, `canPin`, `canHide`, `canReply`,
  `canReact`, `canReport`; each defined key beats the ownership heuristic). `CommentMenuItem.hidden?`,
  `extraActions?(comment, helpers)` appended to the defaults, `commentActions` stays a takeover; kebab honours
  `separatorBefore` (F-03).
- **CT4 moderation → add-on `comment-thread-moderation`** (platform reply; full design in the "U1 amendment" at the end
  of this file): inline edit (`onEditComment`), tombstones (`Comment.state` rendering, `removedMode="tombstone"`) and pin
  (`isPinned` marker). The base keeps the data types and the `{ kind: "state" }` delta.
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

53.9 KB / 60; base after the moderation split ~70 KB → budget **75**; `comment-thread-moderation` ~8 KB (see the
amendment). (The first estimate, ~75–82 KB with moderation in the base, is superseded.)

### Open questions (in the proposal — all answered by the platform reply below)

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

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

- U1 merged with the amendment (CT4 split, size 75 KB); stale text removed. Negative path follows the feature-slicing convention: `onEditComment` / `removedMode` without the add-on → one dev-warn + today's behaviour, and their JSDoc says "requires `comment-thread-moderation`". A comment whose `state` is `"hidden"` / `"deleted"` / `"removed"` is pruned with its replies when the add-on is absent (today's `removed` semantics). [F-12]
- U5: re-run story-viewer's tests and smoke (it imports `CommentComposer`, whose labels change in CT6). [F-19]

---

# Run — Part 3 release 5 (0.4.0 + `comment-thread-moderation` 0.4.0)

| Field | Value |
|---|---|
| **Current stage** | CLOSED — shipped `424f34a`, live-verified 2026-10-26 |
| **Go** | user 2026-10-26: "confirmed you can go and make them done end to end and properly" — and story-viewer must move to comment-thread 0.4.0 in the same release (platform reply `PROUI_REPLY_2026-10-26_ME051_FB_EP.md`). Execution delegated by the user for this release; scope signed by the platform 2026-10-25. |
| **Release** | comment-thread 0.4.0 · comment-thread-moderation 0.4.0 (new feature item; a feature item carries its base's version) · post-card 0.6.0 · story-viewer 0.6.1 · engagement-bar 0.6.1 (patch: likers pill click + full count) · news-card 0.4.5 (patch: honour `CommentMenuItem.hidden`) |
| **Roster** | architect: main session · implementers: Sonnet 5 (comment-thread base + moderation; post-card) · finders: fresh Sonnet 5 |

## U2 — architect decisions (types fixed before the slices)

`types.ts` was rewritten by the architect first so the parallel slices agree. Decisions beyond the U1 text:

1. **Controlled reporting = "once accepted".** `onCommentsChange(next, change)` fires after the handler's promise
   resolves, at once for a handler that returns nothing, and at once for deltas, loaded pages and handle calls. While a
   promise is in flight the change is an overlay over the prop; a rejection drops the overlay and reports nothing, so
   the host never has to revert. (`CommentsChange` union in `types.ts`.)
2. **Built-in reactions per row** (beyond the U1 slot): `reactionKinds` + `onReactComment` make each row's default
   action an engagement-bar reaction picker fed by `Comment.reactions`; `{ kind: "reacted" }` delta. The
   `engagementActions(comment, helpers)` slot still takes over (`helpers.defaultActions`).
3. **`Comment.likes: number | null`** (type widened: `null` withholds the count — C6). Readers doing arithmetic on
   `likes` need a null check; documented in the migration note.
4. **Report on own comments is a fix**: default `canReport` = not own (it showed on your own comments).
5. **Composer owns the failure UI**: `CommentComposer` catches a rejected `onSubmit` (no unhandled rejection), keeps the
   text and shows `labels.postFailed` (`role="alert"`); the thread removes the pending comment and re-throws to it.
   This is the story-viewer coupling — story-viewer 0.6.1 forwards the label and styles the alert for media.
6. **"now"**: `now` prop wins; otherwise read in an effect after mount and every 60 s. Before mount no relative text
   renders (SSR = first client render).
7. **Tombstone state is a render filter, not a reducer branch**: the reducer stores `state`; without the add-on a
   non-visible comment (and its replies) is not rendered + one dev-warn. `removedMode="tombstone"` converts a
   `removed` delta into `state: "removed"` before dispatch (needs the add-on, else warn + prune).
8. **Seam**: `CommentModerationExtension` (in `types.ts`) = `{ EditComposer, Tombstone, PinnedMarker }`; base owns
   edit state and the Edit item (shown when `moderation` + `onEditComment` + `permissions.canEdit` and not pending).
   Feature folder `features/moderation/`, ready value `commentModeration`.
9. **Labels**: `defaultCommentThreadLabels` + `ResolvedCommentThreadLabels`; `DEFAULT_COMMENT_THREAD_LABELS` stays as a
   deprecated alias. `labels.formatRelativeTime` deprecated in favour of the `formatRelativeTime` prop.

## U2 — slices

| # | Slice | Owner | Status |
|---|---|---|---|
| A | comment-thread base 0.4.0 (state, controlled overlay, idempotence, rollback, paging, replies, permissions, reactions, labels, locale/now, RTL indent) + `features/moderation/` + tests | Sonnet 5 implementer | in progress |
| B | post-card 0.6.0 | Sonnet 5 implementer | in progress |
| C | story-viewer 0.6.1, news-card 0.4.5, registry.json, meta / CHANGELOG | architect | after A |

## U2 — result (slice A)

Implementer report: 13 files / 201 tests, 40 fixes falsified (each revert caught). Architect spot-checks: re-ran the
suite (one demo test timed out at 5 s under the parallel run → explicit 30 s budget); replaced `lib/format-time.ts` with
one shared, future-aware formatter (post-card now imports it, its own copy deleted): a future date reads "in 3d" (a poll
closing time read "Closes Just now"), comment rows clamp a timestamp ahead of the viewer's clock to "now", an invalid
locale / zone falls back. New shipped files (10 base + 4 moderation) added to `registry.json`; roster = folder.

## U3 — gate battery (run 1, before the review fixes)

tsc 0 · lint 0 errors / 11 warnings · registry:build 0 (comment-thread 119.5 KB, moderation 6.6 KB, post-card 171.2 KB,
story-viewer 321.1 KB, news-card 181.4 KB; artifact-size 0 high) · doc-budget 0 · tests 2379 passed, 4 failed — all
`Test timed out in 5000ms` under load (3 repo gate tests + 1 entity-picker test; re-run alone at U3 run 2) · build 0.

Size: the U1 estimate (base ~70 KB, budget 75) was wrong — the base is ~134 KB built after the fixes (~15 KB is JSDoc in
`types.ts`). Runtime cost of `<CommentThread>` (rolldown, minified + gzip, externals = react / ui / lucide / sibling
procomps): **5.1 KB (0.3.2) → 10.2 KB**. Budget raised to 140 and the numbers go to the platform in the report-back.
`comment-thread-moderation` carries the base's version (0.4.0) — `sync-registry-versions` stamps feature items with
their base's version (same as `media-editor-capture`).

## U4 — adversarial review (fresh Sonnet finder A on a frozen snapshot)

16 rows. Verdicts (architect): 14 CONFIRMED → fixed (implementer fix wave, each with a regression test that fails
without it — `__tests__/fixes.test.tsx`, 34 tests), 1 docs, 1 DROPPED.

| # | Sev | Finding | Verdict |
|---|---|---|---|
| A1 | ⚠️ | void `onAddComment` after the server echo (same clientId) re-added the temp → duplicate forever | CONFIRMED → fixed |
| A2 | ⚠️ | accept / unknown-parent check read the layout-effect base → two accepts in one tick drop one (controlled); parent + child deltas in one tick drop the child (both modes) | CONFIRMED → synchronous working tree |
| A3 | 🔸 | a finished reply closed whichever reply composer was open | CONFIRMED → fixed |
| A4 | 🔸 | no `onAddComment` (local thread) → posted comments stuck pending | CONFIRMED → normal comment |
| A5 | 🔸 | Enter during IME composition submitted (pre-existing; story-viewer + edit composer depend on it) | CONFIRMED → guarded |
| A6 | 🔸 | focus to `<body>` when the focused Edit Save/Cancel, replies link or Load more unmounts | CONFIRMED → focus moved (kebab trigger / first new item) |
| A7 | 🔸 | `replyCount` never maintained → spurious "View more replies" after a delete | CONFIRMED → kept in step |
| A8 | 🔹 | "a temp id never reaches your server" overstated (custom slots get it, with `isPending`) | CONFIRMED → docs |
| A9 | 🔹 | a throwing `onCommentsChange` / `onSubscribeDelta` → unhandled rejection / false "Couldn't post" | CONFIRMED → guarded |
| A10 | 🔹 | legacy "Load more" heuristic counted the viewer's own posts | CONFIRMED → server-delivered only |
| A11 | 🔹 | reply / page loads survived `reset` and landed on the new tree | CONFIRMED → epoch + cleared state |
| A12 | 🔹 | `handle.openReply` kept a stale focus target | CONFIRMED → fixed |
| A13 | 🔹 | `labels.signInPrompt` read by nothing (inert since 0.1) | CONFIRMED → self-disclosing (`@deprecated @notImplemented` + one dev warning), not rendered (I1) |
| A14 | 🔹 | JSDoc lies: automatic destructive divider; `removedMode` also covers own deletes | CONFIRMED → architect fixed `types.ts` |
| A15 | 🔹 | reaction rows borrowed `kinds[].count` as their tally | CONFIRMED → withheld |
| A16 | 🔹 | `canReact: false` also disables the plain like | DROPPED — intended (gates the row's action); documented |

Second finder (post-card axis, rows that touch comment-thread / its dependents): B5 `timeZone` alone changed the English
relative text → CONFIRMED, architect fixed the shared formatter (`format-time-zone.test.ts`); B16 news-card variants
decided `showKebab` on unfiltered items → CONFIRMED, architect fixed 4 variants (news-card 0.4.5, test); B17 the
composer's failure alert survived a controlled prefill (story-viewer `triggerReply`) → CONFIRMED, fixed in the
composer; story-viewer ignored `commentLabels.composerPlaceholder` → CONFIRMED, architect fixed (story-viewer 0.6.1, test).

Fix wave result: 15 files / 239 tests, every fix falsified. Parked by the implementer: focus hand-off after a load
assumes the items land in the same batch (a controlled host applying the page later leaves focus on the body).

## U5 — runtime (browser finder on `next start -p 3200`, Chromium; then a re-verify on a rebuilt production build)

First pass, 8 rows (release-wide): W1 ⚠️ likers "+N" pill ignored mouse clicks (engagement-bar `useDragScroll` captured
the pointer on press → the click retargeted to the strip) — CONFIRMED, fixed in engagement-bar 0.6.1 (capture after
4 px; released-elsewhere guard); W2 ⚠️ focus to `<body>` after Delete / a moderator removal in comment-thread —
CONFIRMED, fixed (next / previous article, composer, tombstone); W3 ⚠️ post-card likers / share Hide dropped focus —
CONFIRMED, fixed (opener, else the card); W4 🔸 portaled menus laid out LTR in RTL — CONFIRMED, fixed (`dir` DOM
attribute on the content); W5 🔸 pill "+99" vs name "+379 more" — CONFIRMED, fixed (full compact count); W6/W7 🔹
Turkish / Arabic demo tabs left English — fixed (demo); W8 🔹 story-viewer demo returns no focus on close — parked
(host-owned `isOpen`).

Re-verify: W1, W2, W3, W5 PASS. W4 first fix (dir attribute + `align` flipped to "start") PARTIAL — direction and text
right, position still mirrored the wrong way: Radix passes the content's `dir` to the positioned wrapper, so
floating-ui already mirrors `align` for an RTL element and the flip undid it. Architect fix: keep `align="end"`; test
asserts the wrapper carries `dir="rtl"`; re-run of the finder's script: RTL menus 177–305 / 369–497 (aligned to the
kebab's left edge, opening toward the row), LTR unchanged, in-viewport at 390 px. W6/W7 PASS after the architect
completed the visibility / carousel / comment-menu labels. Regression sweep (pending + failed post, load-more and
replies focus, moderation edit focus, reactions picker, poll focus, controlled rollback, double-tap, header slots,
story-viewer failed reply): all PASS. Console: 0 errors / warnings / hydration messages on all four pages; 0 overflow
at 390 px.

## U6 — pre-push doc verifier (fresh Sonnet, read-only)

25 rows. 3 were code bugs, all fixed + falsified by the architect:
- **High, pre-existing since 0.1:** a `renderNode` row returned early, so its replies, on-demand reply loading and
  links were never rendered (every guide since 0.1 said "the thread keeps the tree"). Now the tree renders below the
  slot; the menu is the slot's (documented). `render-node-tree.test.tsx`.
- news-card `openKebab()` with every item hidden armed a later pop-open (0.4.5 scope). `kebab-hidden.test.tsx`.
- engagement-bar likers strip: a press released outside the strip could start a capture-less-button drag on return.
  `likers-strip.test.tsx`.
The other 22 were doc / sample / stale-comment rows (usage sample that failed strict tsc with an optional `options`
argument, the "`timeZone` switches to Intl" line, controlled-add reporting, temp-id wording, `hasMore` / `nextCursor`
scope, `renderViewReplies` scope, `dir` scope, stale post-card mirror / `pollVote` / `reset` JSDoc, samples reading
non-existent `Post` fields, pre-existing install-path / overlay-label lines, the meta size comment) — all corrected.

## U5 — installs (`pnpm test:install`, local `public/r`, fresh Next consumer, consumer `tsc --noEmit`)

Final artifacts (`registry:build` after the last fix), six runs, each a fresh Next consumer + `shadcn add` from the
local `public/r` + consumer `tsc --noEmit`:

| Run | Items | CLI | Result | Installed (with dependencies) |
|---|---|---|---|---|
| a | comment-thread, comment-thread-moderation, post-card, story-viewer, news-card, engagement-bar | 4.18.0 | PASS, tsc 0 | + expandable-text 0.3.0, video-player 0.3.0, media-carousel 0.3.1 |
| b | comment-thread-fixtures, post-card-fixtures | 4.18.0 | PASS, tsc 0 | bases 0.4.0 / 0.6.0 + their dependencies |
| c | comment-thread alone | 4.18.0 | PASS, tsc 0 | + expandable-text 0.3.0, engagement-bar 0.6.1 |
| d | post-card | 3.8.5 | PASS, tsc 0 | + comment-thread 0.4.0, engagement-bar 0.6.1, media-carousel, video-player, expandable-text |
| e | story-viewer | 3.8.5 | PASS, tsc 0 | + comment-thread 0.4.0, engagement-bar 0.6.1, video-player, expandable-text |
| f | comment-thread-moderation | 3.8.5 | PASS, tsc 0 | + comment-thread 0.4.0, engagement-bar 0.6.1, expandable-text |

The first matrix (artifacts from before the last fixes) failed run b: `post-card-fixtures` consumer tsc TS2305 —
`dummy-data.ts` imported comment-thread / engagement-bar types, and inside a fixtures item the CLI rewrites those
imports to the other components' main files. Fixed by deriving every type from `./types`; run b above is the re-run.

## U3 final — battery on the final tree (after every fix, before the commit)

tsc 0 · lint 0 errors / 11 warnings (baseline) · `registry:build` 0 (artifact-size 0 high: comment-thread 134.6 / 150,
moderation 6.6 / 8, post-card 183.6 / 190, engagement-bar 117.9 / 125, story-viewer 321.7 / 340, news-card
181.8 / 210) · doc-budget 0 · tests (`NODE_ENV=production`) **176 files / 2473 passed, 6 skipped, 0 failed, no
timeouts** — comment-thread 17 files / 251, post-card 14 / 190 · `pnpm build` 0 (77 pages). Runtime min + gzip
re-measured: `<CommentThread>` 11.6 KB, post-card's own code 12.8 KB (unchanged by the last fixes).

## U7 — Ship

Commit `424f34a`, pushed 12:52 under the user's Part 3 grant after the final consistency review. Live poll (180 s apart): old versions at +3 / +6 / +9 min, **all six new at +12 min** (comment-thread 0.4.0, comment-thread-moderation 0.4.0, post-card 0.6.0, story-viewer 0.6.1, engagement-bar 0.6.1, news-card 0.4.5). Live artifacts: `comment-thread.json` 22 files, `comment-thread-moderation.json` 4 files
(`features/moderation/…`, none in the base), `post-card.json` 27, `story-viewer.json` 38, `engagement-bar.json` 20,
`news-card.json` 24 — no tests / demo / usage / meta; the `align="end"` kebab, the `renderNode` tree, the 4 px drag
threshold and `post-card-fixtures` importing only `./types` are in. Decision `shipped`; retro in
`.claude/improvement-log.md`; report-back `.claude/report-back-2026-10-26-comment-thread-0-4-0-post-card-0-6-0.md` (to
the user for the platform). **Next release:** carousel-composer 0.3.0 — on the user's go.

# Run — release 7 (engagement-bar 0.7.0 + comment-thread 0.5.0; platform request 2026-10-27, group 1)

This file is the lead state doc for release 7 (as for release 5); `engagement-bar-loop.md` carries a pointer section.

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor**, additive API, plus bug fixes) on engagement-bar + comment-thread; **patch** on post-card / story-viewer (EB-1 wiring + post-card's Safari opener fix) |
| **Current stage** | U7 — built, every gate green, installs 8/8, GATE 3 Pass with follow-ups; awaiting the user's commit + push go |
| **Sign-off policy** | user-interactive (both are composed by post-card / story-viewer / news-card → U1 is the user's call). User "3. yes" (2026-10-28) = go for the run; the scope split below is still open |
| **Version target** | engagement-bar v0.6.1 → **v0.7.0** · comment-thread v0.4.0 → **v0.5.0** · post-card v0.6.0 → v0.6.1 · story-viewer → next patch after 0.6.2 |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 (fresh) |
| **Started / updated** | 2026-10-28 / 2026-10-28 |

Source: `.claude/platform-request-verification-2026-10-28.md` §Group 1 (verified at `415be85`; it wins over the request).

## U0 — Intake & impact

- **Asks:** BLOCKING EB-1, CT-1, CT-2 · non-blocking EB-2…EB-6, CT-3…CT-6 · CT-7 (our F-01). Ground truth + design
  notes per ask in the digest. Extra defects in scope: post-card inline panels lack disclosure state and lose the opener
  on Safari (`post-card/hooks/use-panel-focus.ts:21-22`); comment-thread "View replies" hard-codes
  `aria-expanded={false}` with a dangling `aria-controls`; `initials()` not locale-aware.
- **Blast radius (registry.json):** engagement-bar ← comment-thread, post-card, story-viewer, engagement-bar-fixtures ·
  comment-thread ← news-card, post-card, story-viewer, comment-thread-moderation (feature item),
  comment-thread-fixtures. story-viewer inline-copies engagement-bar action types (guard
  `story-viewer/__tests__/engagement-types.test.ts`) and imports `CommentComposer` + handle (keep unchanged). Interop:
  `CommentMenuItem` / `Comment` shapes used by news-card / event-card / blackboard / post-card — additive only.
- **Size (built):** engagement-bar 120.7 / 125 KB · comment-thread 137.9 / 150 · post-card 188.0 / 190 (gate fails at
  1.2× budget). Every ask grows a base → measure after the last fix wave; post-card has ~2 KB of headroom.
- **Owed follow-ups touched:** comment-thread 0.4.0 F-01 (size → CT-7). Fix-on-touch: `--radix-popover-trigger-width`
  audit (engagement-bar reaction picker popover).

## U1 — Change contract (proposed)

**Scope split (needs the user's call).** The platform asks that release 7 ship the BLOCKING asks fast and keep CT-3 out
(`PROUI_REPLY_2026-10-28_VERIFIED.md`). The user chose a compound split for CT-3 (with CT-7). Proposal:

| | Release 7 (fast) | Release 7b (next) |
|---|---|---|
| engagement-bar | **0.7.0:** EB-1 disclosure + event, EB-5 hide zero | **0.8.0:** EB-2 tap = primary, EB-3 likers links, EB-4 touch size, EB-6 share header / send state |
| comment-thread | **0.5.0:** CT-1 `renderContent`, CT-2 labels (incl. every engagement label), CT-4 author links, CT-6 closed, view-replies aria fix, locale `initials` | **0.6.0:** compound split (Root + List / LoadMore / Composer parts) carrying CT-3 auto-load + pinned composer, CT-5 confirm delete (add-on), CT-7 base-size reduction, EB-4 size forwarding |
| post-card | 0.6.1: EB-1 state on its 3 inline panels + Safari-safe opener (event target, not `activeElement`) | forwards EB-3 links |
| story-viewer | patch: EB-1 state on comment / share | — |

Why this cut: release 7 = 3 blocking + 4 small (S) asks, all additive, no structural change, so it can ship quickly.
Everything medium-sized or structural (EB-2/3/4/6 are M; CT-3/5/7 are the compound split) moves to 7b, where the
compound split and the size work belong together.

**Contract — release 7:**

- **EB-1:** handlers receive the event: `onClick?(event)` (comment / share / custom), `onCountClick?(event)` (like /
  reaction); zero-arg handlers stay assignable. New optional `expanded?: boolean` + `controls?: string` on comment /
  share / custom; on like / reaction they apply to the **count button** only (the heart is `aria-pressed`, the reaction
  trigger is a PopoverTrigger with its own `aria-expanded`), named `countExpanded` / `countControls`. Rendered as
  `aria-expanded`; `aria-controls` only while expanded (a closed panel may be unmounted). Not given → markup unchanged.
  A custom action that is `aria-pressed` and given `expanded` → `expanded` wins, dev-warn. Split-count mode covered.
  Demo "Default (post)" wires its three panels.
- **EB-5:** bar-level `hideZeroCounts?: boolean`: `0` renders no digit and no count in the accessible name, for every
  counted action (like, comment, share, view-count, custom; reaction already does). story-viewer drops its in-repo
  workaround only if behaviour is identical (else keep).
- **CT-1:** `renderContent?(comment, { depth }) => ReactNode` rendered as expandable-text `children`; `measureKey`
  defaults to `comment.content`; plain `content` path unchanged; the edit composer edits raw `content`.
- **CT-2:** `labels.showMore` / `labels.showLess` forwarded to each row's expandable-text; nested
  `labels.engagement?: Partial<EngagementBarLabels>` forwarded to every row's bar (merged under the existing
  `like` / `unlike` keys, which keep precedence for compatibility). `initials()` → `toLocaleUpperCase(locale)` (also in
  `comment-composer.tsx`).
- **CT-4:** `getAuthorHref?(author, comment)` + `linkComponent` (default `"a"`), post-card shape: avatar link
  `aria-hidden` + `tabIndex={-1}`, name link accessible; name in `<bdi>`, `@handle` `dir="ltr"`.
- **CT-6:** `closed?: boolean` + `labels.closed`: no bottom composer, no Reply, open reply composers close,
  `handle.openReply` / `focusComposer` no-op (dev-warn); likes / menus unchanged.
- **Fix:** "View replies" reflects its real state (`aria-expanded` true/false) and sets `aria-controls` only when the
  list is rendered.
- **post-card 0.6.1:** inline-mode actions pass `expanded` / `controls` for comments / likers / share; the opener is
  taken from the triggering event's `currentTarget` (fallback `activeElement`), so focus returns on Safari / macOS
  Firefox.
- **story-viewer patch:** comment / share actions report `expanded` while their panel is open.
- **Tests (C11):** each ask's accept criteria from the request, axe in both states, a non-English labels test that
  finds no English default in the DOM or accessible names (CT-2's accept), falsify every fix. Browser pass on
  `next start`, incl. Safari-like focus (WebKit is not installed here → Chromium with click-focus suppressed, plus a note).

### Invariants

| # | Invariant |
|---|---|
| I1 | No new props → identical markup and behaviour (except the view-replies aria fix) |
| I2 | `CommentComposerProps` / `CommentComposerHandle` unchanged (story-viewer imports them) |
| I3 | engagement-bar action types change additively; story-viewer's inline-copy assignability test stays green |
| I4 | `Comment` / `CommentMenuItem` additive only; comment-thread-moderation installs and works over 0.5.0 |
| I5 | post-card and news-card compile and render unchanged with no new props |
| I6 | No `asChild` on custom components; direct triggers (F-cross-13) |

### Size

Release 7 asks are S each: estimate +3–5 KB engagement-bar (budget 125, likely raised to 130), +4–6 KB comment-thread
(150 OK), post-card +1 KB (188 / 190, raise to 195 if needed). Measure after the last fix wave (retro rule).

### Open question for the user (U1 sign-off)

1. Release 7 / 7b split as proposed (recommended), or everything in one release 7?

**U1 signed — user, 2026-10-28: "A"** (release 7 / 7b split as proposed) + "run parallel agents … if it's possible and
safe". Parallel plan: the architect writes the public types first (retro rule, release 5), then one implementer per
folder (no shared files; coordinator owns registry.json / CHANGELOG / docs). story-viewer's EB-1 wiring waits for the
0.6.2 implementer to leave that folder.

## U2 — architect decisions (types fixed before the slices)

- engagement-bar `types.ts`: `EngagementActionEvent = MouseEvent<HTMLElement>` (exported); comment / share / custom
  take `expanded` / `controls`; like / reaction take `countExpanded` / `countControls`; every `onClick` /
  `onCountClick` receives the event; bar prop `hideZeroCounts`. Custom `active` + `expanded` → `expanded` wins (dev-warn).
- comment-thread `types.ts`: labels `showMore` / `showLess` / `closed` + nested `engagement?: EngagementBarLabels`
  (resolved type keeps it optional); props `renderContent(comment, { depth })`, `getAuthorHref(author, comment)`,
  `linkComponent`, `closed`.

## U2 — slices (2026-10-28, 3 Sonnet implementers in parallel, one folder each)

| Slice | Result | Coordinator spot-check |
|---|---|---|
| engagement-bar 0.7.0 (EB-1, EB-5) | `__tests__/disclosure-0-7-0.test.tsx` (51, each fix falsified); demo "Default (post)" wires its 3 panels; 287 tests in the folder + story-viewer's inline-type guard green | `custom-action.tsx` conflict rule read; no `aria-controls` without `expanded === true` |
| comment-thread 0.5.0 (CT-1, CT-2, CT-4, CT-6, view-replies fix, locale initials) | `__tests__/release-7-0-5-0.test.tsx` (23, falsified); 274 tests in the folder green; `CommentComposerProps` / `Handle` unchanged (locale read from context) | `comment-node.tsx` label merge + `view-replies-link.tsx` read |
| post-card 0.6.1 (disclosure + Safari opener) | `__tests__/disclosure-0-6-1.test.tsx` (10; old `activeElement` code fails the 3 Safari tests); 200 tests green | `hooks/use-panel-focus.ts` diff read: `event.currentTarget` first, `activeElement` fallback |
| story-viewer EB-1 wiring (architect) | sheet ids via `useId`, `commentDisclosure` / `shareDisclosure` only where a sheet mounts; `__tests__/disclosure-0-6-2.test.tsx` (3; wiring removed → 2 fail) | — |

## U3 — gate battery (run 1, before the review fixes)

tsc 0 · lint 0 errors / 11 warnings (baseline 13 — fewer) · meta-deps ✓ · registry validators ✓ (whitelist, registry-json,
naming, no-control-chars, barrel `--strict`, inert `--strict`) · registry:build ✓ (incl. tokens, contract, changelog,
artifact-size) · doc-drift ✓ · doc-budget ✓ · tests 2882 passed / 1 failed / 6 skipped (206 files) — the failure is
code-block `review-regressions` "loads the grammar into EVERY instance" timing out at 5 s (known load flake; passes
alone 4/4). Sizes: engagement-bar 123.5 / 125 KB · comment-thread 140.4 / 150 · post-card 185.6 / 190 · story-viewer
329.7 / 340.

## U4 — adversarial review (2 fresh Sonnet finders, read-only, on the working tree)

| # | Finding | Source | Verdict | Fix |
|---|---|---|---|---|
| A1 | post-card: the likers panel a heart tap auto-opens (`openLikersOnLike`) gets no event → on Safari the opener is `body`, focus returns to the card; meta over-claimed | finder A | CONFIRMED | meta + guide say the opener fix covers the 3 bar buttons; follow-up FU-1 (needs an event on `onToggle` — engagement-bar API) |
| A2 | post-card: actions built in the `engagementActions` slot get no disclosure state (slot has no access to the open panel / ids) | finder A | CONFIRMED | documented (meta, `PostInlineDisclosure` JSDoc); follow-up FU-2 (post-card 0.7.0: pass the disclosure to the slot) |
| A3 | `defaultPostEngagementActions` (public) gained a parameter whose type was not exported | finder A | CONFIRMED | renamed `PostInlineDisclosure`, exported from the barrel |
| A4 | post-card `meta.ts` documented the old `defaultPostEngagementActions` signature | finder A | CONFIRMED | updated |
| A5 | custom action warned on `active={false}` + `expanded` (no real conflict) | finder A | CONFIRMED | warn only when `active === true`; test added |
| A6 | story-viewer's type-parity test sampled only a like arm | finder A | CONFIRMED | comment / share samples with `expanded` / `controls` added |
| B1 | `labels.engagement.like` / `unlike` could never apply (the resolved thread default always won) — a dead public surface | finder B | CONFIRMED | explicit thread label > engagement label > default (`lib/labels.ts`); JSDoc + guide; test (falsified) |
| B2 | the paged "more replies" link announced `aria-expanded="true"` though pressing it loads more | finder B | CONFIRMED | `ViewRepliesLink` `disclosure` prop: that link carries no `aria-expanded`, keeps `aria-controls` on the shown list; test (falsified) |
| B3 | `closed`: the `renderNode` helper's `onReply` still reached `openReply` (silent, stale trigger ref) | finder B | CONFIRMED (hygiene — the render-phase reset already kept the box closed, so no visible change; the test pins the behaviour and does not fail without the guard) | `openReply` returns early while closed |
| B4 | `closed` drops a half-typed draft and the notice is not announced | finder B | CONFIRMED (minor) | documented in the guide |
| B5 | story-viewer: the removal notice after a paused media notice computes remaining time from wall clock | finder B | CONFIRMED (edge) | follow-up FU-3 (story-viewer 0.7.0) |
| B6 | story-viewer: Play does nothing during a notice on a single-item, stay-until-closed story | finder B | CONFIRMED (edge) | follow-up FU-4 (story-viewer 0.7.0) |

Both finders: no Blocker / High. "Checked and clean" lists in their reports (I1 markup, aria-controls targets, event
synchronicity, imperative handle, hooks rules, barrel, R1–R8 mechanics, the modified `progress-0-5-4` test).

## U5 — runtime (browser finder, fresh Sonnet, `next start -p 3200` on the battery-4 build; Chromium, 1280 + 390, light + dark)

Brief: `E:/tmp/ilinxa-release-kit/briefs/brief-r7-browser.md`; scripts + screenshots `E:/tmp/ilinxa-release-kit/browser-r7/`.
Safari focus simulated with `dispatchEvent(new MouseEvent("click"))` (WebKit not available in the helper).

| # | Finding | Verdict | Fix |
|---|---|---|---|
| W1 | comment-thread RTL tab: `@sara` rendered as `sara@` — the handle was isolated only when author links were on (implementer kept I1 strictly), while the guide promises it always | CONFIRMED (ours) | name always in `<bdi>`, `@handle` always `dir="ltr"` (invisible in LTR); I1 amended like the view-replies fix; test added |
| W2 | comment-thread: "View N replies" past maxDepth unmounts on click → focus to `<body>`; its `aria-expanded="true"` is never observable | CONFIRMED (pre-existing since 0.4.0, in this release's area) | focus moves to the first revealed reply (`focusFirstShown` effect); test added |
| W3 | story-viewer link-drawer opener: `aria-label="Shop now"` vs visible "example.com" (axe `label-content-name-mismatch`) | CONFIRMED (pre-existing) | follow-up FU-5 (story-viewer 0.7.0) |
| W4 | light-mode contrast: engagement-bar liked count `text-destructive` 4.44:1; comment-thread `text-muted-foreground/80` timestamps 4.25–4.48:1 | CONFIRMED (pre-existing) | follow-up FU-6 |
| W5 | engagement-bar LikersStrip scroller at 390 px: axe `scrollable-region-focusable` | CONFIRMED (pre-existing) | follow-up FU-7 (with EB-3, release 7b) |
| W6 | story-viewer unfilled progress tracks faint over white (filled segment clear; R3 met) | DROPPED (R3 asks "visible"; tracks are the 30 % track by design) | — |
| W7 | Turkish "14 dk. önce" wraps to 3 lines in a narrow nested row at 390 px | PARKED (cosmetic) | — |
| W8 | docs-site install tabs: `aria-controls` to a missing Radix id | PARKED (site shell, not a component) | — |

Passing (evidence in the agent report): EB-1 on all 3 demo panels × normal / Safari-like click × 1280 / 390 (24
combinations, focus returns, `aria-controls` targets exist); `hideZeroCounts` names carry no "0"; no new
`aria-expanded` on other tabs (I1); comment-thread Rich & links (links, Tab order skips the avatar link, Show more,
closed / reopen), Türkçe (no English strings), view-replies ids; post-card panel switches never dangle and Safari-like
focus returns; story-viewer R1 (X / Escape / auto-close, click / Enter), R2 (one named progressbar), R4 (no focusable
inside `aria-hidden` ghosts idle / mid-drag), R6 (release outside resumes), R7 (Space / Play end the notice), sheets'
`aria-expanded`. 0 console errors across 16 page × viewport × scheme runs; no horizontal overflow.

## U5 — re-verify + installs

- **Browser re-verify** (rebuilt production server, `E:/tmp/ilinxa-release-kit/browser-r7/reverify-w1w2.mjs` +
  `dbg-w1.mjs`): W1 — RTL tab, every `@handle` `dir="ltr"`, `unicode-bidi: isolate`, name in `<bdi>`
  (screenshot `reverify-rtl-1280.png`); W2 — after "View 1 reply" on Nested d3 focus is the revealed reply's
  `<article>` at 1280 and 390; 0 console messages.
- **Installs** (`pnpm test:install`, local `public/r`, fresh Next consumer, `E:/tmp/ilinxa-release-kit/installs-r7.sh`):

| Run | Items | CLI | Result | Components landed |
|---|---|---|---|---|
| a2 | engagement-bar | 4.18.0 | PASS, consumer tsc 0 | engagement-bar |
| b2 | comment-thread + comment-thread-moderation | 4.18.0 | PASS, tsc 0 | comment-thread, engagement-bar, expandable-text |
| c | comment-thread-fixtures | 3.8.5 | PASS, tsc 0 | comment-thread, engagement-bar, expandable-text |
| d | post-card | 3.8.5 | PASS, tsc 0 | + media-carousel, post-card, video-player |
| e | story-viewer | 4.18.0 | PASS, tsc 0 | comment-thread, engagement-bar, expandable-text, story-viewer, video-player |
| f | story-viewer | 3.8.5 | PASS, tsc 0 | same |
| g | news-card (dependent of comment-thread) | 4.18.0 | PASS, tsc 0 | comment-thread, engagement-bar, expandable-text, news-card |
| h | engagement-bar-fixtures | 3.8.5 | PASS, tsc 0 | engagement-bar |

  The first a / b runs failed before installing anything: the consumer's `pnpm install` hit its 600 s timeout (cold
  store under host load); re-run unchanged → pass. Negative path: run h installs the fixtures item alone and lands only
  engagement-bar.
- **Final battery (run 5, serial tests):** tsc 0 · lint 0 errors / 11 warnings · every validator ✓ · registry:build ✓ ·
  doc-drift ✓ · doc-budget ✓ · build ✓ · tests 203 / 206 files in the run (2830 passed) — the 3 others (filter-bar
  hardening, code-block review-regressions, entity-picker hardening) failed only on worker-start / 5 s / 60 s
  timeouts under host load from other projects' test runs, and pass alone (49 / 4 / 52). Sizes: engagement-bar 123.5 /
  125 · comment-thread 141.4 / 150 · post-card 185.9 / 190 · story-viewer 329.7 / 340 KB.

## U6 — pre-push doc verifier (fresh Sonnet, read-only) + final battery

- 21 rows, no High. Medium: the reply over-claimed (the composer story-viewer imports changed — locale initials;
  post-card's heart-tap likers panel; only `onClick` / `onCountClick` get the event), a stale story-viewer guide line
  (every segment a progressbar), and **one real gap: story-viewer's close-focus fix did nothing after a mouse / touch
  open on Safari / macOS Firefox** (a clicked button is not focused, so the opener was `body`). Fixed in code: while
  closed, each viewer remembers the last pressed control (`pointerdown`, capture) and uses it when nothing is focused;
  test "Safari-like open" (fallback removed → fails); browser re-verify `reverify-sv-safari.mjs`: focus back on "Open
  image-only story" at 1280 and 390. All Low rows fixed in the guides / CHANGELOG / meta (`updatedAt`) /
  `PostInlineDisclosure` field docs.
- **Final battery (run 6, final tree):** tsc 0 · lint 0 errors / 11 warnings · meta-deps ✓ · whitelist ✓ ·
  registry-json ✓ · naming ✓ · no-control-chars ✓ · barrel ✓ · inert ✓ · registry:build ✓ · doc-drift ✓ ·
  doc-budget ✓ · **tests 206 / 206 files, 2890 passed, 6 skipped** · build ✓. Sizes: engagement-bar 123.5 / 125 ·
  comment-thread 141.8 / 150 · post-card 186.3 / 190 · story-viewer 330.8 / 340 KB.
- GATE 3: `engagement-bar-procomp/reviews/2026-10-28-v0.7.0-disclosure.md` and
  `comment-thread-procomp/reviews/2026-10-28-v0.5.0-release-7.md` — both **Pass with follow-ups**. post-card 0.6.1 and
  story-viewer 0.6.2 are patches (no review file required).

## U7 — Ship

Awaiting the user's go to commit + push (new release; the Part 3 push grant does not cover it).

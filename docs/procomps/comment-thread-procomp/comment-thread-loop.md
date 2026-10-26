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

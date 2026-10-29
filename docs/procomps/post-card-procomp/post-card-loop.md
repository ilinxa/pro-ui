# Loop state — `post-card` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23 |
| **Sign-off policy** | patch — architect proceeds (batch plan docs/plans/fix-now-batch-plan.md, sign-off delegated by user 2026-10-23) |
| **Version target** | v0.5.0 -> v0.5.1 |
| **Model roster** | architect: main session · implementer: Sonnet 5.5 |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

## U0 — Reproduction (batch B2)

Source: `post-card.tsx` (pre-fix) `onMediaDoubleTap` = `barRef.current?.triggerLike(); setBurstKey(k+1)` unconditionally. `engagement-bar.tsx` `triggerLike` toggles (`next = !stateRef.current.liked`) and returns early when no `like` action exists.

1. Liked post (`isLiked: true`), feed variant, `onLike` set, double-tap media -> bar toggles to unliked, `onLike(id,false)` fires, heart burst plays. (Unlike on double-tap.)
2. `engagementActions` slot without a `like` action -> `triggerLike` early-returns, burst plays anyway.
3. `renderEngagementBar` takeover -> `barRef` never attached (`barRef.current` null), burst plays anyway.
4. Handle `triggerLike()` on a liked post -> unlikes AND bursts; with 2/3 -> burst with no effect.

Caveat: the implementer wrote the regression tests after the fix (no git stash allowed in shared tree), so red-before was established by code reading, not by a recorded failing run. Architect may confirm by reverting the two hunks locally.

## Stage checklist (U-loop)

- [x] U0 Intake — blast radius + reproduction (above)
- [x] U1/U2 Contract — see batch plan B2 row; sign-off: patch — architect proceeds (batch plan docs/plans/fix-now-batch-plan.md, sign-off delegated by user 2026-10-23)
- [x] U3 Implement — slices below
- [x] U4 Gate battery / adversarial review — architect — gates 1–8 green; review done (F-A6 dropped)
- [ ] U5 Runtime & smoke — architect
- [ ] U6 Docs & GATE 3 — architect
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

## Slice plan

| # | Slice | Owner | Status | Evidence |
|---|---|---|---|---|
| 1 | `getLikeCapableBar` (bar mounted + `like` action present); `onMediaDoubleTap` likes only if bar state not liked, burst only when capable | implementer | done | `post-card.tsx` (`engagementActionsRef`, `getLikeCapableBar`, `onMediaDoubleTap`) |
| 2 | Handle `triggerLike`: toggle kept, burst only when result is liked, none when not capable | implementer | done | `post-card.tsx` useImperativeHandle `triggerLike`; deps now include `getLikeCapableBar` |
| 3 | Regression tests (6) | implementer | done | `__tests__/double-tap-like.test.tsx` — 6 passed |
| 4 | meta.ts 0.5.1 + feature/changelog line; guide (handle comment, patterns, renderMedia slot) | implementer | done | `meta.ts` version/updatedAt; guide "Double-tap semantics" bullet |

"Liked" source: the bar's own `getCurrentState().liked` (the exact value `triggerLike` toggles against; covers controlled overlay and uncontrolled). Like-action presence: `engagementActionsArr` mirrored into a ref.

## Invariants

| # | Invariant (testable) | Reviewed | Observed |
|---|---|---|---|
| I1 | Double-tap on liked post: stays liked, `onLike` not called, burst shown | | test 1 |
| I2 | Double-tap on unliked post: `onLike(id,true)` once, liked, burst | | test 2 |
| I-neg1 | No like action in slot -> no burst, no onLike | | test 3 |
| I-neg2 | `renderEngagementBar` takeover -> no burst | | test 4 |
| I3 | Handle `triggerLike` on liked: `onLike(id,false)`, unliked, no burst; on unliked: like + burst | | tests 5, 6 |

## Blast radius

Dependents via registry.json `registryDependencies` for `@ilinxa/post-card`: only `post-card-fixtures` (registry.json:3211) and the deprecated alias entry (registry.json:9096). No other component imports post-card (grep of `src/registry/components/**` for post-card imports finds only meta.ts `related`/`internal` lists and docs/usage text, in comment-thread, engagement-bar, news-card, story-rail, media-carousel, story-composer, story-viewer; none import its code). Public API unchanged (no type changes). Behavior change: double-tap no longer unlikes; burst conditional.

| Surface | Why touched | Synced |
|---|---|---|
| `post-card.tsx`, `meta.ts` (0.5.1) | fix + version | yes |
| guide | double-tap/handle semantics | yes |
| `registry.json` / `manifest.ts` | no file added; version not in registry.json files[] | coordinator to confirm |
| STATUS.md | version row | coordinator |

## Gate battery (implementer subset)

Batch-wide numbers copied from `docs/plans/fix-now-batch-plan.md` (2026-10-23).

| Gate | Result |
|---|---|
| tsc | exit 0, 0 errors (consumer-strict flags) |
| lint | exit 0 — 0 errors, 14 warnings (= known baseline) |
| meta-deps | exit 0 — 64/64 clean |
| registry validators | all exit 0: whitelist ✓ · registry-json 0 high / 6 warn (all pre-existing: filter-bar ×2, rich-text-editor `@platejs/resizable`, post-card ×2, project-card) · naming 0 · no-control-chars 1438 files · barrel-exports 0 high · inert-surfaces 0 · registry-tokens 0 (new) |
| doc validators | doc-drift ✓ (inside registry:build) · doc-budget ✓ |
| registry:build | exit 0 — 66 artifacts, artifact-size 0 high; `cssVars` + new files verified in `public/r/*.json` |
| build | exit 0 — compiled in 3.8 min, 77/77 static pages (first attempt OOM'd on a memory-starved host; retry clean) |
| tests (`NODE_ENV=production`) | exit 0 — **35 files / 263 tests** (first run of the session: 14 files + 21 worker-start timeouts — the known cold-start flake; retry clean, counts compared) |
| component tests (implementer run) | 6 passed (1 file), exit 0 |

## Findings table (stage 5)

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| F-A6 | post-card: two same-tick handle `triggerLike()` calls both burst | finder (B1–B6) | DROPPED | a real double-tap spans ticks; handle callers are imperative | — |

## Parked

- `heartBurstWired` requires `onLike`: a post with no `onLike` never bursts nor double-tap-likes even though the bar toggles locally. Pre-existing; left as specified.
- Reaction-default double-tap deferred to a later loop (per brief).

## Pre-mortem

If this breaks for a consumer: a host relying on double-tap to unlike (unlikely), or a custom bar whose like action lives under a non-`like` kind (burst now suppressed).

---

# Run — Part 3 (social-platform request §5.6 PC1–PC4 + owed forwarding)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — label templates become functions; 0.x minor) |
| **Current stage** | U1 signed (scope: platform 2026-10-25) — U2 starts on the user's go for its release |
| **Sign-off policy** | user-interactive. Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.5.3 → **v0.6.0** (ships after comment-thread 0.4.0; an engagement-bar patch drops the LikersStrip alias) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.6 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1157-1255`) as amended by the digest §Part 3; owed items from
`engagement-bar-procomp/reviews/2026-10-24-v0.5.0-hardening.md` (R-06) and
`media-carousel-procomp/reviews/2026-10-24-v0.3.0-hardening.md` (R-05).

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** platform 2026-10-25 (`PROUI_REPLY_2026-10-25_PART3.md`); the user's go is given per release (order in the platform reply)
- [ ] U2 · [ ] U3 · [ ] U4 · [ ] U5 · [ ] U6 · [ ] U7

## U0 — Intake

Not in `closed`. Baseline 10 rows: template-fill 2 (`parts/poll-widget.tsx` `{count}`, `{time}`), intl 1
(`parts/edited-suffix.tsx` `toLocaleString()`), clock 3 (`poll-widget.tsx` `new Date()`, `post-card.tsx:189`
`format(…, new Date())` in render, a `votedAt`), jsx-literal 4 (`parts/list-variant.tsx` "likes ·" / "comments" /
"· shares", `parts/post-header.tsx` "Post actions"). One test file; no RTL demo. Built 144.1 KB / budget 165.

| Item | Code today | Verdict |
|---|---|---|
| PC1 controlled `post` | `useState<Post>(initialPost)` (`post-card.tsx:156`); only `reset()` pushes; `likers` also seeded once (`:175`) | confirmed |
| PC2 reactions | `Post` is single-like; unlike-on-double-tap already fixed; still: double-tap needs a `like` action (`getLikeCapableBar`), `heartBurstWired` needs `onLike` (`:202-206`) | partial |
| PC3 header | "Post actions" hard-coded; `renderHeader` drops the kebab; no author link, `subtitle`, notice slot, append-only extra actions, per-item `hidden` | partial (per-action hide exists via `permissions`) |
| PC4 time | render-time `new Date()` (hydration risk); default formatter is comment-thread's English `defaultRelativeTime`; poll `new Date()` drives "closed"; `{count} votes` template | confirmed |
| Owed R-05 / R-06 | carousel gets only `items` / `variant` / `onDoubleTap`; bar gets no `locale` / `formatCount`; LikersStrip / ShareMenu get deprecated props; `likersMoreLabel` is a `"+{count} more"` string feeding LikersStrip's `moreAriaLabelTemplate` (`template-ok` escape); expandable-text gets no `labels` | confirmed |

Blast radius: imports comment-thread (component, handle, `defaultRelativeTime`, `toDate`, `CommentMenuItem`, many types),
engagement-bar (`EngagementBar`, `LikersStrip`, `ShareMenu`), media-carousel, expandable-text. Its permissions matrix is
inline-copied by story-viewer and news-card (must stay compatible). No code dependents, no feature slices.

## U1 — Change contract (proposed)

- **PC1:** `onPostChange?(next)` beside the existing `post`: controlled when `onPostChange` is passed (`post` wins every
  render; optimistic like / bookmark shown until the handler settles; a rejected promise rolls back). `optimistic?`
  (default `true`). Handlers may return a promise. `post` alone stays mount-only; `reset()` works in both modes.
  `likers` resyncs in controlled mode. Realtime deltas must not fight the controlled value.
- **PC2:** a card prop `reactions?: { kinds, counts?, viewerReaction?, onReact?, defaultKind?, totalCount? }` (the
  `Post` shape that story-viewer and news-card mirror stays as is). With it, the default actions build a `reaction`
  action, double-tap applies `defaultKind` only when nothing is applied, and the burst plays once.
  `heartBurstWired` = `onLike` or `reactions.onReact`. Without it: today's like path.
- **PC3:** `getAuthorHref?(author, post)` (avatar + name link via `linkComponent`, above the card overlay link);
  `subtitle?`; `noticeSlot?(post)`; `labels.kebabAriaLabel`; `renderHeader(post, { currentUser, kebab })` (the kebab
  survives a custom header); `extraKebabActions?(post)` appended, not gated by `canModerate`; `hidden` on menu items
  (`CommentMenuItem`, coordinated with comment-thread); per-action disabled via `permissions.disabled?`.
- **PC4:** `now?`, `locale?`, `timeZone?`. Default `now` captured once on mount, so server and first client render
  agree. The poll and the edited suffix use them. English output unchanged without `locale`.
- **Labels become functions (the breaking part):** `likersMoreLabel(count, formatted)`, `pollTotalVotes(count,
  formatted)`, `pollClosesAt(time)`, list meta counts. Then engagement-bar drops LikersStrip's
  `moreAriaLabelTemplate` alias and its `template-ok` escape (engagement-bar patch, same release).
- **Forwarding:** one top-level `locale` reaches carousel, bar, LikersStrip, ShareMenu, expandable-text and the thread.
  `mediaProps?` (`aspect`, `onMediaError`, labels…), `engagementBarProps?` (`formatCount`, `optimistic`, previews…),
  `textLabels?`; LikersStrip / ShareMenu get `labels`. Thread passthrough for comment-thread 0.4.0
  (`onCommentsChange`, `onLoadMoreCursor`, `onLoadReplies`, `onEditComment`, `extraActions`, `locale`).
- **Tests:** `describeContract`, `locale="tr"` + hydration, controlled post + rollback, reaction-only double-tap,
  header slots, RTL demo; the 0.5.1 / 0.5.3 double-tap tests stay green.

### Invariants

| # | Invariant |
|---|---|
| I1 | `post` alone = mount-only; handle (`reset`, `getCurrentPost`) unchanged |
| I2 | English output unchanged without `locale` (relative time "Just now" / "5m") |
| I3 | double-tap never unlikes; no burst when nothing applies (0.5.1 / 0.5.3 tests) |
| I4 | `renderHeader` / `renderMedia` / `renderEngagementBar` / `kebabActions` stay takeovers; overlay link below interactive children |
| I5 | permissions matrix shape compatible with the story-viewer and news-card copies |

### Size

144.1 KB / 165; estimate +14–18 KB → ~158–162. Budget → **180** (decided at U3 on the real number).

### Open questions (in the proposal)

1. Label templates → functions as a breaking 0.6.0 (recommended), or keep strings as deprecated aliases?
2. Reactions as a card prop (recommended) or new `Post` fields?
3. M8: do they need part of this sooner than the full release (e.g. forwarding + time + header first)?

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- M8 does **not** need post-card sooner (they shipped their own card and comment rows for M8; they swap when 0.6.0 + comment-thread 0.4.0 close). Release 4.
- Label templates → functions (breaking 0.6.0) **confirmed**; reactions as a card prop not contested → as recommended.

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

- **Moderation passthrough:** forward `moderation` (the `comment-thread-moderation` extension) to the thread, with tests with and without the add-on — the post-detail page uses it. [F-02]
- **Names:** the existing keys `likersMoreLabel`, `pollTotalVotesLabel`, `pollClosesAtLabel` become functions (as proposed). List-meta counts get **new** function keys (additive, not breaking). [F-06]
- **engagement-bar alias stays:** removing LikersStrip's `moreAriaLabelTemplate` would break engagement-bar (public prop + test). post-card stops using it; the alias stays deprecated. No engagement-bar bump for this. [F-07]
- Pass a stable module-level empty array instead of `commentThread ?? []` (comment-thread's new identity dev-warn would fire every render) + test. [F-13]

---

# Run — Part 3 release 5 (0.6.0)

| Field | Value |
|---|---|
| **Current stage** | CLOSED — shipped `424f34a`, live-verified 2026-10-26 |
| **Go** | user 2026-10-26 ("go … end to end and properly"); execution delegated for this release; scope signed by the platform 2026-10-25. Ships with comment-thread 0.4.0 (see that loop doc's "Run — Part 3 release 5"). |

## U2 — architect decisions (types fixed before the slice)

1. **Controlled = "reported once accepted"**, same model as comment-thread: `onPostChange(next, change)` after the
   handler's promise resolves (at once for a sync handler and for engagement deltas). In flight: an overlay over the
   prop; a rejection drops it. Uncontrolled: the local mirror rolls back on rejection. `PostChange` union.
2. **Reactions** = `reactions?: PostReactions` card prop; it replaces the like action in the default actions.
   Double-tap = `triggerReaction(defaultKind)` only when the bar's current reaction is `null`; burst once.
3. **Comment passthrough = one bag** `commentThreadProps` (cursor paging, `onLoadReplies`, `onCommentsChange`,
   `moderation`, `extraActions`, reactions…); the card's own comment props win when defined. Stable module-level empty
   array instead of `commentThread ?? []` (F-13).
4. **Nested labels** `likersLabels` / `shareLabels` / `textLabels`; LikersStrip / ShareMenu get `labels` + `locale`
   (no deprecated props; the `moreAriaLabelTemplate` alias stays in engagement-bar, F-07). `defaultPostCardLabels` +
   `ResolvedPostCardLabels`; `DEFAULT_POST_CARD_LABELS` deprecated alias.
5. **`permissions.disabled`** (per action) renders kebab items disabled; `CommentMenuItem.hidden` honoured.
6. **`likers`** goes straight to LikersStrip (it shows the prop on every render plus what it loaded) — resyncs in both modes.

## U2 — result

Implementer report: 10 files / 151 tests, 58 mutations falsified. Architect follow-ups: post-card's own
`lib/format-time.ts` deleted in favour of comment-thread's shared formatter; `labels.openRepost(name)` added (the
quoted card's link name was hard-coded English, `repost-label.test.tsx`); a poll closing in the future reads
"Closes in 3d" (`poll-countdown.test.tsx`); `votePoll` JSDoc corrected. 4 new shipped files added to `registry.json`.

## U3 — gate battery (run 1): see comment-thread-loop.md "Run — release 5 / U3" (one battery for the release).
post-card 171.2 KB built before the review fixes; budget 190 pending the final number.

## U4 — adversarial review (fresh Sonnet finder B on a frozen snapshot)

19 rows. Verdicts (architect): 15 CONFIRMED → fixed (post-card fix wave, `__tests__/fix-wave.test.tsx`, 25 tests, each
failing without its fix) or fixed by the architect, 2 docs, 2 recorded as follow-up/docs.

| # | Sev | Finding | Verdict |
|---|---|---|---|
| B1 | ⚠️ | controlled reports built from a passive-effect base → two changes before a commit lose one | CONFIRMED → synchronous working post |
| B2 | ⚠️ | controlled state not bound to `post.id` (pending like / reveal / panel / vote carried to the next post) | CONFIRMED → reset on id change, late settles ignored |
| B3 | 🔸 | list meta + poll total now compact ("8.7K likes", "1 vote") — English output changed | CONFIRMED → kept (consistent with the bar); CHANGELOG + usage say so |
| B4 | 🔸 | nested repost card mount-only → stale under a controlled outer card | CONFIRMED → follows its prop |
| B5 | 🔸 | `timeZone` alone changed English relative text | CONFIRMED → architect fixed the shared formatter |
| B6 | 🔸 | `reactions` without `onReact` + `onLike` → double-tap set a reaction nobody heard | CONFIRMED → burst needs `onReact` |
| B7 | 🔸 | likers pill used `post.likes` with `reactions` (a withheld total leaked) | CONFIRMED → `reactions.totalCount` |
| B8 | 🔸 | `renderCommentSection` helpers ignored `commentThreadProps` | CONFIRMED → merged handlers |
| B9 | 🔹 | double vote with `optimistic={false}`; focus to `<body>` when the vote button unmounts | CONFIRMED → fixed |
| B10 | 🔹 | controlled no-op changes reported | CONFIRMED → skipped |
| B11 | 🔹 | an old string label silently ignored | CONFIRMED → one dev warning per key |
| B12 | 🔹 | handle identity churned with an inline `onVotePoll` | CONFIRMED → stable |
| B13 | 🔹 | host `formatRelativeTime` gets a future date (poll) | CONFIRMED → documented in `types.ts` |
| B14 | 🔹 | poll percentages not locale-formatted | CONFIRMED → `Intl.NumberFormat` percent |
| B15 | 🔹 | `openKebab()` with no items armed a later pop-open | CONFIRMED → no-op |
| B16 | 🔹 | news-card `showKebab` on unfiltered items | CONFIRMED → architect fixed (news-card 0.4.5) |
| B17 | 🔹 | composer alert survived a story-viewer prefill | CONFIRMED → fixed in comment-thread's composer |
| B18 | 🔹 | fixtures read the clock at module load | CONFIRMED → fixed `DUMMY_NOW` |
| B19 | 🔹 | `commentThread` stays read-once while `post` is controlled — undocumented | CONFIRMED → documented in `types.ts` + guide |

Fix wave result: 13 files / 180 tests, every fix falsified.

## U5 / U6 — browser, doc verifier, installs

One record for the release: see `../comment-thread-procomp/comment-thread-loop.md` ("U5 — runtime", "U6 — pre-push doc
verifier", "U5 — installs"). post-card rows: W3 (panel Hide focus), W4 (RTL menu), W6/W7 (demo labels) — fixed and
re-verified. Install finding: the `post-card-fixtures` item failed consumer tsc (TS2305) — `dummy-data.ts` imported
comment-thread / engagement-bar types, which the CLI rewrites to those components' main files inside the fixtures item;
fixed by deriving every type from post-card's own `./types`.

## U7 — Ship (release 5)

Commit `424f34a`, pushed 12:52 under the user's Part 3 grant after the final consistency review. Live poll (180 s apart): old versions at +3 / +6 / +9 min, **all six new at +12 min** (comment-thread 0.4.0, comment-thread-moderation 0.4.0, post-card 0.6.0, story-viewer 0.6.1, engagement-bar 0.6.1, news-card 0.4.5). Live `post-card.json`: 27 files, no tests; `post-card-fixtures.json` imports only `./types`. Detail:
comment-thread-loop.md "U7 — Ship".

# Run — 0.6.1 (release 7, with engagement-bar 0.7.0 + comment-thread 0.5.0)

Lead state doc: `docs/procomps/comment-thread-procomp/comment-thread-loop.md` → "Run — release 7". Patch (no new
props; one optional parameter + exported type `PostInlineDisclosure` on the public `defaultPostEngagementActions`):
inline panels carry `aria-expanded` / `aria-controls`; the opener is the clicked button (`event.currentTarget`), so
focus returns on Safari / macOS Firefox. Test `__tests__/disclosure-0-6-1.test.tsx` (10; the old `activeElement` code
fails the 3 Safari tests). Follow-ups: **FU-1** heart-tap likers panel still uses `activeElement` (needs an event on
`onToggle`), **FU-2** the `engagementActions` slot gets no disclosure state (post-card 0.7.0).

### U7 — Ship (release 7)

Commit `bc3089f`, pushed 19:51 UTC on the user's "Push" (2026-10-28). Live poll (180 s apart): Vercel pending and old artifacts at +3 / +6 / +9 min; **build success and all four new at +12 min** — `engagement-bar.json` serves `hideZeroCounts`, `comment-thread.json` `getAuthorHref`, `post-card.json` `PostInlineDisclosure`, `story-viewer.json` the last-pressed opener fallback. Detail: comment-thread-loop.md "Run — release 7".

# Run — 0.7.0 (release 7b, with engagement-bar 0.8.0 + comment-thread 0.6.0)

Lead state doc: `docs/procomps/comment-thread-procomp/comment-thread-loop.md` → "Run — release 7b". Minor, additive:
`likersStripProps` / `shareMenuProps` forwarding (share panel stays open with send state), `engagementBarProps.size` /
`hideZeroCounts`, `reactions.tapAction` / `primaryKey` / `hoverOpenDelay`, the host `onLike` receives the click event
(only when there is one), FU-1 (heart-tap opener) and FU-2 (slot gets `PostInlineDisclosure`, now with `likes`), the
inline thread in a `CommentThreadScrollArea`. Test `__tests__/forwarding-0-7-0.test.tsx` (falsified). Review
`reviews/2026-10-29-v0.7.0-forwarding.md` — Pass with follow-ups. Sign-off delegated by the user for this run.

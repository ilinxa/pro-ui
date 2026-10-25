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
| **Current stage** | U1 — **awaiting sign-off** (Part 3 proposal) |
| **Sign-off policy** | user-interactive. Ask before every push. |
| **Version target** | v0.5.3 → **v0.6.0** (ships after comment-thread 0.4.0; an engagement-bar patch drops the LikersStrip alias) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.6 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1157-1255`) as amended by the digest §Part 3; owed items from
`engagement-bar-procomp/reviews/2026-10-24-v0.5.0-hardening.md` (R-06) and
`media-carousel-procomp/reviews/2026-10-24-v0.3.0-hardening.md` (R-05).

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — sign-off: pending
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

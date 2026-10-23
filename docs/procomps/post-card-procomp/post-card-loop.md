# Loop state — `post-card` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | U7 — gates 1–8 green, consumer smoke 23/23 + tsc 0; committed locally, push awaits user |
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
- [ ] U7 Ship — architect

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

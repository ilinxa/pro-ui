# Loop state — `story-viewer` (U-loop)

## Run 2026-10-23 — B1 (v0.5.1 → v0.5.2)

### Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23 |
| **Sign-off policy** | patch — architect proceeds (batch plan docs/plans/fix-now-batch-plan.md, sign-off delegated by user 2026-10-23) |
| **Version target** | v0.5.1 → v0.5.2 |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: — |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

### Stage checklist

- [x] U0 Intake & impact — blast radius + reproduction recorded below
- [x] U1 Change contract — batch plan (docs/plans/fix-now-batch-plan.md); sign-off per policy above
- [x] U2 Implement — slice table below
- [x] U3 Gate battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — finders; findings table below
- [x] U5 Runtime & smoke — `pnpm build` ✓ (77 pages); consumer smoke (shadcn@4.18.0, local `public/r`): 23/23 installs exit 0, consumer `tsc` 0 errors; cssVars land only in `@theme inline`; base media-editor compiles without the capture slice
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder)
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

### U0 Blast radius

Dependents (grep of `registry.json` + cross-imports, 2026-10-23):

| Surface | Why touched | Synced |
|---|---|---|
| `registry.json` item `story-viewer` (~:3295) | new shipped file `lib/is-editable-target.ts` must be added to `files[]` (coordinator-owned) | pending (coordinator) |
| `data/story-rail` (demo/usage/types/meta reference story-viewer) | consumes `<StoryViewer>` public props only; none changed | no change needed |
| `media/media-editor` (`parts/editor-canvas.tsx`, `features/capture/parts/editor-camera.tsx`) | import from story-viewer folder text matched; no import of the touched hooks | verify at coordinator gate |
| `meta.related` only: post-card, pdf-viewer, story-composer, video-player | name reference only | no change |
| `registryDependencies` on `@ilinxa/story-viewer` (registry.json ~:3469, ~:9456) | alias/replacedBy entries | no change |
| `meta.ts` / guide | version 0.5.2, feature entry, removal + keyboard + triggerReply behaviour | done |

Public API: unchanged signatures. `triggerReply(content?)` now does what its JSDoc says. New internal `ReplyComposer.prefill` prop (part-level, not exported through the barrel).

### Reproduction (written before the fix)

**(a) Removal.**
- Input 1: stories `[A(a1,a2), B(b1)]`, viewer open on a1; `handle.dispatch({kind:"remove-item", storyId:"A", itemId:"a1"})` (same via `stories` delta `item-removed`).
- Happened: cursor id still names a1; derived index `Math.max(0, -1)` = 0 replays item 0; `itemKey` unchanged so progress is not reset, `completedRef` stays true, progress freezes at 100%.
- Should: shows a2, progress restarts from 0 and advances, completes into B.
- Input 2: remove the current group A (`remove-story`). Happened: `findIndex < 0` makes `goToNextItem`/`goToPrevItem`/`goToNextStory`/`goToItemIndex` early-return, so all navigation is dead. Should: show B's first item, navigation works.
- Input 3: remove the sole group. Happened: viewer stays open on nothing. Should: `onClose` fires.
- Input 4: opened with `stories=[]`, then `add-story`/delta arrives. Cursor ids `""` never match; the progress key is stale. Should: first item shows and progress advances.

**(b) Keyboard.**
- Input: reply textarea focused (`viewerMode="viewer"`), type a space / press ArrowRight. Happened: window listener `preventDefault`s Space (the space cannot be typed) and toggles pause; ArrowRight advances the item while editing. Also IME composition keys and Space on a focused button triggered the viewer. Should: all ignored; the button/textarea keeps its own behaviour. Same for the kebab panel's window Escape listener.

**(c) triggerReply.**
- Input: `handle.triggerReply("hi")`. Happened: composer focused, `content` ignored (empty-bodied `if`), though `types.ts` advertises pre-fill and the guide said "setValue stubbed in v0.2.0". Should: the textarea contains "hi" (and the story pauses as it does when typing).

### Slice table

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | Cursor repair + `snapCount` + close on empty (`hooks/use-story-viewer-state.ts`, `resolveCursor`) | implementer | done | hook file `resolveCursor` + render-time repair; test `(a)` x4 |
| 2 | No cube animation for the snap (`story-viewer.tsx` `trackedSnap`) | implementer | done | `trackedSnap` branch in the cube-tracking block |
| 3 | Keyboard guard (`lib/is-editable-target.ts`, `hooks/use-story-keyboard-nav.ts`, `parts/kebab-panel.tsx`) | implementer | done | test `(b)` x5 |
| 4 | triggerReply pre-fill (`story-viewer.tsx`, `parts/reply-composer.tsx` controlled value + `prefill`) | implementer | done | test `(c)` |
| 5 | Regression tests `__tests__/regressions-0-5-2.test.tsx`, meta 0.5.2, guide | implementer | done | 10/10 pass; 7/10 fail against HEAD sources |

### Invariants

| # | Invariant (testable) | Reviewed (U4) | Observed live (U5) |
|---|---|---|---|
| I1 | The cursor never names a story/item absent from `stories` for a committed render | | |
| I2 | After removal of the current item, `itemKey` changes, progress restarts from 0 and reaches the next item | | |
| I3 | Removing the last remaining group calls `onClose` exactly once | | |
| I4 | Window keydown does nothing for editable targets / `isComposing`; Space on a button/link is not `preventDefault`ed | | |
| I5 | `triggerReply(text)` sets the composer text, repeatable with a new text | | |
| I-neg | Space on the document body still toggles pause; ArrowRight on body still advances | | test "positive control" |

### Gate battery

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
| component tests (implementer run) | `NODE_ENV=production pnpm exec vitest run --project components src/registry/components/media/story-viewer` : 10/10 |

### Findings table (stage 5)

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| F-A1 | story-viewer: unsent reply draft carries to the next item; a pre-fill after an abandoned draft doesn't pause | finder (B1–B6) | CONFIRMED 🔸 | `ReplyComposer` not keyed per item | `key={story:item}`; test "an unsent draft is discarded…" (falsified: red without the key) |
| F-A2 | story-viewer: a group added/removed *before* the current one plays a spurious cube animation (pre-existing, adjacent) | finder (B1–B6) | CONFIRMED 🔸 | cube branch compared indices only | `trackedCursor.storyId`; snap on same-story index shift; test "a group inserted BEFORE…" |
| F-A3 | story-viewer: removing the last group while earlier groups exist moves back instead of closing | finder (B1–B6) | DROPPED (documented) | contract wording vs a reasonable fallback | guide states the fallback order |
| F-A4 | story-viewer: `hasContent` drifts false after a failed send | finder (B1–B6) | CONFIRMED 🔹 | state not derived | derived from `text` |
| F-A5 | story-viewer: arrows on slider/listbox/combobox/spinbutton still navigate | finder (B1–B6) | CONFIRMED 🔹 | `isEditableTarget` selector | roles added; test |

### Runtime & smoke evidence (stage 6)

_(architect)_

### Parked

- Removing an earlier (non-current) group shifts the current group's index, and the cube tracker then compares stale indices (can play a spurious cube animation). Pre-existing, outside B1.
- `parts/kebab-panel.tsx` `useEffect` depends on `props` object (lint warning) — pre-existing.
- GATE verdict: _(architect)_

---

# Run — Part 3 (social-platform request §5.7 SV1–SV19)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — SV1 optional `src`, SV11 / SV17 handler signatures; 0.x minor) |
| **Current stage** | release 1 (0.5.4) shipped `a842f23`, live-verified 2026-10-25; 0.6.0 next (needs the user's go) |
| **Sign-off policy** | user-interactive. Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.5.3 → **v0.6.0** (option: the bug fixes first as 0.5.4) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.7 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1256-1433`) as amended by the digest §Part 3 "story-viewer".

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** platform 2026-10-25 (`PROUI_REPLY_2026-10-25_PART3.md`) + user "go" on release 1 (0.5.4) 2026-10-25; user authorized pushing each Part 3 release without asking, after a final consistency review. The "go" covers 0.5.4; confirm with the user before starting 0.6.0.
- [ ] U2 · [ ] U3 · [ ] U4 · [ ] U5 · [ ] U6 · [ ] U7

## U0 — Intake

Not in `closed`. Baseline 5 rows: palette (`text-rose-400` liked heart), intl ×2 (`types.ts` default `formatTime`,
`lib/format-time.ts`, which is **dead but shipped**), jsx-literal ×2 (`parts/owner-overlay.tsx` "Loading viewers…",
"No viewers yet."). Two test files. Built 211 KB / budget 240.

Already fixed: SV7 (keys from editable targets), SV10 (removal), `triggerReply(content)`, draft-per-item, index-shift
cube snap. Open, by user-visible severity:

| Item | Code today | Verdict |
|---|---|---|
| SV6 Escape | the kebab adds its own window Escape listener (`parts/kebab-panel.tsx:39-42`) and Radix closes the whole dialog, so the reply draft is lost; `parts/bottom-sheet.tsx` is always mounted, with no focus trap / Escape / focus return, and closed sheets stay tabbable | confirmed |
| SV3 progress | wall-clock timer; on video metadata the duration change restarts without banking elapsed time (jumps back); `onEnded={goToNextItem}` (`story-viewer.tsx:1153`) bypasses the completed guard → double advance + double `onItemViewed` | confirmed, wider |
| SV2 timer before load | progress starts with `isOpen && !!currentItem`; `<img>` has no `onLoad`; video not gated on `canplay` | confirmed |
| SV4 pause reasons | one boolean; a host `setPaused(true)` is undone by item change (`use-story-viewer-state.ts:375`), panel close (`story-viewer.tsx:689`), long-press release (`:476`); no `visibilitychange` | confirmed |
| SV5 | only comments / share pause; kebab, owner list, link drawer and reaction popover don't | confirmed |
| SV8 / SV9 | long-press release fires the tap (advances); pointer handlers have no target check (a drag in the reply box swipes); a stale `swipeJustEndedRef` swallows a later click | confirmed |
| SV11 | delete / report / copyLink / saveToHighlights / shareToFeed get the group id; like and reaction share the `react` permission; engagement counts start at 0 | confirmed (breaking) |
| SV16 | `stories` read once; `goToNextStory` / `goToStoryIndex` skip `onItemViewed` for the item left | confirmed |
| SV1 | `src` required; no `resolveMedia`, frame callbacks or `onMediaError` | confirmed (breaking: optional `src`) |
| SV12–SV15, SV17–SV19 | no caption / item time (formatter already overridable); no reduced motion; fixed 400×700 card + chevrons inside; tap zones `aria-hidden`, no live region; `onLoadViewers(storyId)` once per group, errors swallowed; root re-renders every 50 ms; RTL: zones mirror but keys / swipe / cube / chevron icons don't | confirmed (SV17 breaking) |

**Inline-type sync (owed):** the four engagement types copied from engagement-bar (`types.ts:170-280`) have **drifted**
from engagement-bar 0.5.0: `align` lacks `start` / `end`, no `disabled` / `hidden`, counts not nullable, handlers can't
return a promise, `reaction` lacks `totalCount` / `onCountClick`. An `actions as any` cast in
`parts/engagement-overlay.tsx` hides it. Comment-thread copies: no drift. Dependents: the alias only; story-rail
references the props in docs. Decision 3 also applies (`bg-black text-white` shell → media-overlay tokens).

## U1 — Change contract (proposed)

- **SV6:** top-layer Escape: sheets become real layers (focus trap, Escape, focus return, closed = unmounted or
  `inert`); the dialog's Escape is prevented while a sheet is open; the kebab's window listener goes. The draft survives
  a sheet Escape.
- **SV2 / SV3:** a ready gate (image `load`, video `canplay`, or a custom frame's `onReady`). Video progress from media
  time; advance on `ended` through the completed guard; elapsed time banked on duration change. Images keep the timer.
- **SV4 / SV5:** a pause-reasons set (`hold`, `reply-focus`, `sheet`, `hidden-tab`, host strings).
  `pauseReasons` / `onPauseReasonsChange` controlled pair (opt-in). `setPaused` stays as the host's reason and now
  survives item changes. Every sheet adds `sheet`; `visibilitychange` adds `hidden-tab`.
- **SV8 / SV9:** swallow the click that ends a long press; no swipe / long-press from form controls,
  `[data-no-swipe]` or open layers; the stale ref is cleared on pointer-up.
- **SV11 (breaking):** content handlers receive `{ story, item }` (author handlers keep the author id); a `like`
  permission (default = the `react` value, so today's output holds); initial per-item counts from props,
  `number | null`.
- **SV16:** `stories` + `onStoriesChange` controlled pair (wins every render, id-anchored cursor); `onItemViewed` for
  every item left by a forward move.
- **SV1 (breaking):** `StoryItem.src?`; `resolveMedia?(item)` for the current + next item only; `RenderItemContext`
  gains `onReady` / `onEnded` / `onProgress` / `onError`; `onMediaError?(item)` (once, resumes).
- **SV12–SV15, SV17–SV19:** `caption?` + item `createdAt?` + `locale`; delete the dead `lib/format-time.ts`; reduced
  motion (fade, no cube, no scale); card-size CSS vars (today's 400×700 default) + `max-height: calc(100dvh - 2rem)` +
  `navArrowsPlacement` (default `inside`); labelled previous / next buttons for assistive tech + a polite position
  region; `onLoadViewers(itemId, cursor)` with paging + Retry + labels (breaking); progress state moved into the bars;
  RTL keys / swipe / cube / chevron icons mirror.
- **Inline types:** sync the four copies to engagement-bar 0.5.0, remove the `as any`, add a type-level assignability
  test. Media-overlay tokens on the shell.
- **Tests:** a reproduction per bug first, then `describeContract`, `locale="tr"` + hydration, RTL demo, axe, render
  count on ticks; video-player's `dependents` tests stay green.

### Invariants

| # | Invariant |
|---|---|
| I1 | compound exports; cursor repair; key guard; `triggerReply` pre-fill; draft-per-item |
| I2 | cube thresholds (0.3 width, 0.5 px/ms); `disableStoryTransition`; 400×700 default card; chevrons inside by default |
| I3 | Escape with no sheet open closes the viewer; short taps unchanged |
| I4 | LTR output identical after the RTL work; images and explicit-`duration` items keep the timer |

### Size

211 KB / 240; estimate +25–35 KB → ~240–250. Budget → **280** (nothing here is heavy composition).

### Open questions (in the proposal)

1. Two releases (bug fixes SV2/3/5/6/8/9 first as 0.5.4, then the breaking 0.6.0) or one? Recommendation: two.
2. Host pause survives item changes (recommended), and the draft survives a sheet Escape (recommended)?
3. Reactors (`@notImplemented` today): remove in the breaking release (recommended) or implement?

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- Two releases confirmed: **0.5.4** (SV2 / SV3 / SV5 / SV6 / SV8 / SV9, no API change) first, then **0.6.0**.
- `reactors` / `onLoadReactors`: **remove** in 0.6.0 (they use the viewers list, SV17).
- Questions 2 (host pause survives item change; draft survives a sheet Escape) not contested → as recommended.

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

**0.5.4 (release 1):**
- Custom `renderItem` frames count as ready immediately in 0.5.4 (no `onReady` until SV1 in 0.6.0). [R-01]
- A media load **failure** also counts as ready (today's behaviour, the story never freezes); a cached image (`img.complete` at mount) is ready at once. [R-02]
- SV5 on today's single pause flag: remember whether the viewer was paused when the first layer opened and restore that when the last layer closes, so closing a sheet never resumes a host / user pause. The reason set stays 0.6.0 (SV4). Layers in 0.5.4: comments, share, kebab, owner viewers list, link drawer. [R-03]
- The **reaction popover** can't pause in 0.5.4: engagement-bar exposes no picker open state. Moves to 0.6.0 with an additive engagement-bar prop (`onReactionPickerOpenChange`, engagement-bar minor). [R-04]
- SV6 Escape goes through the dialog's `onOpenChange` (called by both Radix and Base UI on Escape), which closes only the top layer; the kebab's own window listener is removed (no Radix-only `onEscapeKeyDown`, F-cross-13). Containment: everything behind an open sheet is `inert`, closed sheets are `inert` (both focus managers skip inert). Focus returns to the opener. [R-05]
- SV3 video progress follows `onTimeUpdate` (~4 Hz), interpolated between updates so the bar doesn't step; explicit-`duration` videos keep the timer. [R-06]
- The stale `swipeJustEndedRef` is also cleared on the next `pointerdown`. [R-07]
- 0.5.4 is a **patch**: bug fixes + a regression test per fix. Contract closure (baseline rows, `closed`, `describeContract`, RTL demo, `--media-overlay` `cssVars.theme` mapping) lands with 0.6.0. [R-08]
**0.6.0 additions:** the liked heart's `text-rose-400` → token; `viewerCount: number | null` (SV17); ship the `--media-overlay` mapping on this item; re-run this component's tests + smoke after comment-thread 0.4.0 (it imports `CommentComposer`). [R-09 / F-09 / F-11 / F-19]

## U2 — Implement, release 1 = 0.5.4 (2026-10-25)

User "go" on release 1 (2026-10-25). Class **patch** (no public-API touch). Scope = SV2, SV3, SV5 (minus reaction popover),
SV6, SV8, SV9 as corrected by the pre-U2 scope review (R-01 … R-08).

### Reproductions (written before fixing; U5 replays them)

| # | Input | Today | Expected |
|---|---|---|---|
| P1 SV2 | image item whose `load` hasn't fired; advance 6 s | progress reaches 100 % and advances | progress stays 0 until `load`; then runs the full duration |
| P2 SV2-neg | image `error`; or `img.complete` already true at mount; or a `renderItem` frame | — | counts as ready: timer runs (today's behaviour) |
| P3 SV3 | video item, no explicit `duration`, metadata arrives at 3 s into playback | timer restarts → bar jumps back | bar follows `currentTime / duration`; never moves back |
| P4 SV3 | video plays to `ended` while the timer also completes | `goToNextItem` twice → skips an item, `onItemViewed` ×2 | exactly one advance, one `onItemViewed` |
| P5 SV5 | open kebab / owner list / link drawer | timer keeps running | paused while open; on close the pre-open paused state is restored |
| P6 SV5 | host `ref.setPaused(true)`, open + close comments | closing resumes (overrides the host) | stays paused |
| P7 SV6 | comments sheet open with a typed reply draft elsewhere; press Escape | whole viewer closes, draft lost | only the sheet closes; focus returns to the opener; second Escape closes the viewer |
| P8 SV6 | kebab open; Escape | kebab listener + dialog both act → viewer closes | only the kebab closes |
| P9 SV6 | sheet open; Tab ×N | focus can leave the sheet; closed sheets' buttons are tabbable | focus cycles inside the open sheet; closed sheets never receive focus |
| P10 SV8 | long-press (≥ threshold) on the right tap zone, release | resumes **and** advances | resumes, stays on the item |
| P11 SV9 | horizontal drag starting inside the reply input | swipes to the next author, captures the pointer | no swipe, no long-press pause |
| P12 SV9 | swipe ends with the finger off the zone (no click follows); then click the right zone | that later click is swallowed | the click advances |

### Slices

| # | Slice | Owner | Files |
|---|---|---|---|
| 1 | SV2 + SV3 (ready gate, media-time progress, completed guard) | implementer A (Sonnet) | `hooks/use-story-progress.ts`, `parts/item-view.tsx`, the progress wiring + `onEnded` in `story-viewer.tsx` (≈ lines 270–292 and the `ItemView` props ≈ 1140–1160), new `__tests__/progress-0-5-4.test.tsx` |
| 2 | SV5 + SV6 + SV8 + SV9 (layers, Escape, inert, gestures) | implementer B (Sonnet) | `story-viewer.tsx` (panel-pause effect, gesture handlers, `handleOpenChange`, layer state), `hooks/use-long-press-pause.ts`, `parts/bottom-sheet.tsx`, `parts/kebab-panel.tsx`, `parts/owner-overlay.tsx`, `parts/link-cta.tsx`, `parts/viewer-shell.tsx` (only if needed), new `__tests__/layers-gestures-0-5-4.test.tsx` |
| 3 | version 0.5.4, CHANGELOG, guide notes, existing-test upkeep | architect | `meta.ts`, `CHANGELOG.md`, guide, `index.ts` stamp via build |

### U2 results (2026-10-25)

| Slice | Result | Evidence |
|---|---|---|
| 1 SV2 + SV3 | done (implementer A) | `__tests__/progress-0-5-4.test.tsx` 9 tests; falsified 6 fixes, all CAUGHT (the failing-video fallback test is a negative guard). jsdom: `img.complete` is false and `load` never fires, so `regressions-0-5-2` now stubs `HTMLImageElement.prototype.complete` (fixture only) |
| 2 SV5 + SV6 + SV8 + SV9 | done (implementer B) | `__tests__/layers-gestures-0-5-4.test.tsx` 11 tests; 7 failed on the unfixed code; every fix falsified, all CAUGHT |
| 3 coordinator | done | `meta.ts` 0.5.4; CHANGELOG bullet; architect additions below |

Architect additions after the slices:
- **Keyboard behind a layer:** focus now moves into an open layer, so Space / arrows there toggled or navigated the story behind it. `useStoryKeyboardNav` moved below the layer block and disabled while any layer is open. Test P8b; falsified (revert → 1 failed), restored.
- The layers test file now stubs `complete` too — without it, P5's "progress didn't move" assertion passed vacuously (images never became ready).
- `parts/bottom-sheet.tsx`: `right-0 … left-0` → `inset-x-0`.
- Story-viewer files after the additions: 4 files, 38 tests passed.

Known behaviour (documented in the CHANGELOG): a video blocked from autoplay waits at 0 instead of the timer running past it; tests that expect an image story to advance must fire `load` or stub `complete`; custom `renderTapZones` buttons need `data-story-tapzone`.

Parked (from slice 2): stale `commentsOpen` / `shareOpen` / `kebabOpen` across a viewer close → reopen (pre-existing; layer effects are gated on `isOpen`); `ReplyComposer`'s own pause ref vs the layer restore when `onReply` finishes while a layer is open (needs the SV4 reason set, 0.6.0).

## U4 — Adversarial review, release 1 (1 fresh Sonnet finder, code on a frozen snapshot)

U3 first pass (stopped to take these fixes; re-run after): tsc 0 (24 s) · lint 0 (200 s) · registry:build 0 (55 s) ·
doc-budget 0 · tests stopped mid-run (not a failure).

| # | Finding | Verdict | Fix |
|---|---|---|---|
| U4-1 ⚠️ | media `{key, pct}` never reset → revisiting a half-watched video (or reopening) shows the old % and the never-backward guard blocks updates | CONFIRMED | reset on item entry + open transition; test |
| U4-2 ⚠️ | non-finite / zero duration (live / HLS) keeps the item media-driven and the timer paused → frozen at 0 (0.5.3 advanced it) | CONFIRMED (regression) | timer fallback for that item; test |
| U4-3 🔸 | dismissing the link drawer / viewers list with a tap also toggles pause or advances (the click lands on a tap zone after the outside-pointerdown close) | CONFIRMED | swallow the click after an outside-press dismiss; tests |
| U4-4 🔸 | `<img>` keyed by item id, readiness by story:item → reused img across stories with shared item ids bypasses the gate; ready state not cleared on reopen | CONFIRMED | key img + VideoPlayer by story-qualified key; clear on `isOpen`; tests |
| U4-5 🔸 | CHANGELOG claims focus return for every layer; viewers list / link drawer don't | CONFIRMED | add focus return to both; test |
| U4-6 🔸 | coverage gaps: layer order, Escape on viewers list / link drawer, `inert` lifted on host close, restore on item change, revisit, non-finite duration | CONFIRMED | tests added with the fixes |
| U4-7 🔹 | host `setPaused(true)` while a layer is open is overridden by the restore snapshot | ACCEPTED for 0.5.4 (SV4 reason set, 0.6.0) | documented |
| U4-8 🔹 | siblings mounting while a sheet stays open aren't inert | ACCEPTED for 0.5.4 (0.6.0 layer work) | parked |
| U4-9 🔹 | a video that fails mid-play falls back to a timer starting at 0 (bar jumps back) | fix if trivial | — |
| U4-10 🔹 | long-press swallow flag lingers until the next pointerdown (touch holds often fire no click) | CONFIRMED | also clear after ~400 ms; test |

U4 fixes landed (implementers A + B, each falsified — all CAUGHT): U4-1, U4-2, U4-4 (slice 1: progress tests 9 → 15);
U4-3, U4-5, U4-6, U4-10 (slice 2: layer tests 11 → 23; also: closing the viewer resets every layer flag — fixes the
parked stale-flag-on-reopen item). U4-9 skipped (needs a seed option on the exported progress hook — not in a patch).
Architect: tsc caught two effects without a final `return` (TS7030) in `link-cta.tsx` / `owner-overlay.tsx` — fixed.
Lesson: implementer briefs should include `pnpm tsc --noEmit` (24 s here), not only targeted vitest.

## U3 — Gates, release 1 (after the U4 fixes)

tsc 0 (5 s) · lint 0 errors / 13 warnings (baseline) · registry:build 0 (contract: no new violations; jsx-literal
635 → 634) · doc-budget 0 · tests **1536 passed / 114 files** (5 skipped) · build 0 (63 s). Artifact
`public/r/story-viewer.json` **230.76 KB / 240**, 30 files, `meta.version` 0.5.4, no `__tests__`, LF.

## U5 — Runtime & smoke, release 1

**Browser (fresh Sonnet finder, Chromium, production build on `next start -p 3200`):** every reachable 0.5.4 claim PASS —
held image (3 s `page.route` delay) keeps the bar at 0 until it loads; a 404 image still advances; video bar monotonic
(incl. a `NaN`-then-known duration); one advance per item; all 5 layers pause and restore (pre-paused and not); Escape
closes only the top layer, draft kept, second Escape closes; focus returns to each opener; closed sheets never focused
(40 Tabs); Space / ArrowRight inert behind a sheet; long-press release doesn't advance; drag from the reply input doesn't
swipe; dismiss-tap only dismisses; light / dark × desktop / 390×844 without overflow; console clean (only its own 404s).

| # | Finding | Verdict |
|---|---|---|
| B-1 🔸 | Tab past the last control of a sheet / the actions menu doesn't wrap (the dialog focus scope's first / last candidates ignore `inert`) | CONFIRMED → `lib/focus-wrap.ts` (`wrapTabWithinLayer`) on the sheet root and the menu; tests; falsified CAUGHT |
| B-2 🔸 | viewers list: focus doesn't move in; chrome behind stays focusable | DROPPED for 0.5.4 — non-modal layer by design (no trap); focus return holds |
| B-3 🔸 | link drawer: story controls behind stay focusable | DROPPED for 0.5.4 — non-modal, same as B-2 |
| B-4 🔸 | collapsed reaction rail (`aria-hidden`, invisible, click-through) still takes Tab focus — pre-existing | CONFIRMED → `inert={!expanded}` on the rail; test (the first version was vacuous — matched a closed sheet — rewritten, now CAUGHT) |
| B-5 🔹 | focus lands on `body` after the viewer closes in the demo (opened by state, not a trigger) | parked — host / demo concern |
| B-6 🔹 | dark theme: reply pill nearly invisible on a bright photo — pre-existing | parked → 0.6.0 (tokens) |
| B-7 🔹 | Space on a focused button inside a layer activates it | native behaviour, no change |

New file `lib/focus-wrap.ts` added to `registry.json` (story-viewer files). Story-viewer + video-player dependents tests:
5 files, 79 passed.

**Installs (`pnpm test:install`, items story-viewer + story-viewer-fixtures):** CLI 4.18.0 all checks pass (base, then
fixtures; consumer tsc 0). CLI 3.8.5: base alone passes (tsc 0); **fixtures added after the base writes nothing (exit 0)**
— 3.8.5 asks about overwriting an identical `story-viewer.tsx` during the dependency re-resolve. **Pre-existing:**
reproduced with a full 0.5.3 artifact built from git HEAD. A single-file item with either version's `story-viewer.tsx`
re-adds as identical, and `--overwrite` rewrites it byte-identical, so only the full dependency re-resolve trips it.
Workaround verified: `add @ilinxa/story-viewer-fixtures` alone on 3.8.5 → 0 prompts, all files incl. `lib/focus-wrap.ts`,
consumer tsc 0. Guide Install section documents it; review follow-up F-01 (root cause, 0.6.0).

## U6 — Docs & review, release 1

Guide (mental model #4, progress notes incl. jsdom testing, accessibility, long-press / gestures, install note), `meta.ts`
features (dialog / keyboard lines corrected, 0.5.4 line), CHANGELOG bullet, STATUS row + recent activity, decision
`.claude/decisions/2026-10-25-story-viewer-v0-5-4.md`, review
[`reviews/2026-10-25-v0.5.4-fixes.md`](reviews/2026-10-25-v0.5.4-fixes.md): **Pass with follow-ups** (5, all → 0.6.0).
Final gates after the last edits: tsc 0 · lint 0 errors (13 baseline warnings) · registry:build 0 · build 0 · tests
1539 / 114 files (battery) · story-viewer + dependents 79 / 5 files. Final consistency review: version 0.5.4 on meta /
STATUS / component-versions / CHANGELOG / served artifact; roster = folder minus demo / usage / meta / dummy-data /
`__tests__`; meta features and CHANGELOG claims match the code.

## U7 — Ship, release 1

Pushed under the user's Part 3 push grant (after the final consistency review). Live check: see below.

**Live (2026-10-25, poll 4, ≥ 150 s apart):** `https://ui.ilinxa.com/r/story-viewer.json` serves `meta.version` 0.5.4,
31 files incl. `lib/focus-wrap.ts`, no `__tests__`, one version stamp, `wrapTabWithinLayer` in the served source;
`story-viewer-fixtures` 0.5.4. **Release 1 closed.** Next: 0.6.0 on the user's go.

### Platform reply to 0.5.4 (`E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_STORY_VIEWER_0.5.4.md`)

- They will **not install 0.5.4**; they adopt **0.6.0** once live and contract-closed (their viewer is being split to
  match the 0.6.0 interface).
- **Request 1 — delete repair through the controlled prop:** removing an item / story from a controlled `stories` must run
  the SV10 repair exactly as `dispatch` / `reset` / `subscribe` do (move to the next item, never keep playing the removed
  one) + a test. → in 0.6.0 SV16 scope; test added to the contract.
- **Request 2 — keep the names:** frame callbacks `onReady` / `onEnded` / `onProgress(currentTime, duration)` / `onError`,
  `resolveMedia`, `pauseReasons`, `onLoadViewers(itemId, cursor)`, `onItemViewed`, `{ story, item }` handlers. All match
  U1. Any rename must be announced in the 0.6.0 change contract before building.
- **"Behaviour we will rely on (not new scope)" — architect check:**
  - *Unavailable item (deleted / expired / `resolveMedia` 404) is skipped after a short notice; a single-item story opened
    from a link shows the notice + a close button* → **NOT in U1** (U1 has `onMediaError` once-then-resume only; no
    notice UI, skip timing, labels, or "opened from a link" signal). New scope — user decision.
  - *Auto-advance never enters a group the host marks muted; direct open still works* → **NOT in U1**; `Story` has no
    muted flag and nothing skips groups. New scope — user decision.
  - *Viewers list belongs to the author; rendered only when given data* → already holds (owner mode, host-provided data).

## U1 amendment — 0.6.0 change contract (2026-10-25)

User decisions (2026-10-25): **add both** reply behaviours to 0.6.0; **go on 0.6.0 after the change contract is
confirmed by the platform**. Platform-facing contract: `.claude/contract-2026-10-25-story-viewer-0.6.0.md` (local).
Additions to the U1 above (everything else as U1 + the pre-U2 corrections + the 0.5.4 review follow-ups F-01…F-05):

- **Muted groups:** `Story.muted?: boolean`; every sequential move (auto-advance, tap / arrow / swipe next and previous,
  the swipe preview's neighbours) skips muted groups; a direct open (`initialStoryIndex`, `goToStory`) plays one; only
  muted groups ahead → end-of-last-story behaviour. (Both directions proposed; platform to confirm.)
- **Unavailable items:** `resolveMedia` → `null` / reject, media error without a new `src` from `onMediaError`, or removal
  of the on-screen item from `stories` → pause, `labels.unavailable` (polite status) for `unavailableNoticeMs` (default
  1500; `0` = 0.5.x immediate move), then the SV10 repair. `onItemUnavailable?(storyId, itemId, reason:
  "resolve" | "media" | "removed")`. `standalone?: boolean` + single-item story → notice stays with
  `labels.unavailableClose`.
- **Delete repair through controlled `stories`:** same repair as `dispatch` / `reset` / `subscribe`; tested per path.
- **Names frozen** (platform builds on them): frame callbacks `onReady` / `onEnded` / `onProgress(currentTime, duration)`
  / `onError`, `resolveMedia`, `pauseReasons` + `onPauseReasonsChange`, `onLoadViewers(itemId, cursor)`,
  `onItemViewed(storyId, itemId, itemIndex)` (unchanged signature), `{ story, item }` content handlers.
- **Release coupling:** engagement-bar 0.5.0 → 0.6.0 (additive `onReactionPickerOpenChange`) ships with story-viewer 0.6.0.
- Breaking list for the migration note: handlers `{ story, item }`; `onLoadViewers` signature + return; optional `src`;
  `setPaused` persists; `reactors` removed; removal shows the notice (1.5 s) unless `unavailableNoticeMs={0}`.

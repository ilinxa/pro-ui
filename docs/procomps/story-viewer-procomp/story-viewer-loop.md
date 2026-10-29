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
| **Current stage** | 0.6.0 CLOSED — shipped `c89aac2`, live 2026-10-25; 0.5.4 shipped `a842f23` |
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

## U1 final — 0.6.0 (platform confirmed 2026-10-25; user "go", fold all 5 additions)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_STORY_VIEWER_0.6.0_CONTRACT.md`: **confirmed, build.** Muted
groups skip in **both** directions. Five additive additions, folded in by the user's decision:

1. `onItemViewed(storyId, itemId, itemIndex, cause: "completed" | "left")` — 4th argument; `"left"` for an item left by a
   jump to another author (the 0.6.0 SV16 addition), `"completed"` when it played to the end.
2. `loadTimeoutMs?: number` (default off) → the unavailable path with `onItemUnavailable` reason `"timeout"`.
3. `StoryItem.viewerCount?: number | null` — owner mode shows the current item's count; `Story.viewerCount` is the
   fallback.
4. `renderHeaderBadge?(story, item) => ReactNode` — after the author name, before the time; no default content.
5. Pinned in tests: `resolveMedia` never called for the previous item / story; with the story transition disabled or
   under reduced motion the swipe preview mounts no second media element; `src` lives only in component state (never
   storage / URL).

### Semantics fixed by the architect (where the contract was silent)

- **Pause reasons:** `isPaused = reasons.size > 0`. Built-in reasons: `user` (middle tap / Space — cleared on item
  change, the 0.5.x behaviour), `host` (`setPaused(true)` adds, `setPaused(false)` removes `host` **and** `user`;
  persists across items), `hold` (long press), `reply-focus` (composer focused), `sheet` (any layer open — replaces the
  0.5.4 restore snapshot, fixing F-02), `hidden-tab` (`document.visibilityState === "hidden"`), `unavailable` (notice
  showing). Controlled `pauseReasons` / `onPauseReasonsChange(next)` wins every render (host strings allowed);
  uncontrolled = internal set.
- **Unavailable "removed":** when the on-screen item disappears from `stories` (any path: controlled prop, `dispatch`,
  `reset`, `subscribe`), the viewer keeps a notice frame (no media) for `unavailableNoticeMs`, then runs the SV10 repair.
  `0` = repair immediately (0.5.x). With `standalone` and a single-item story the notice stays with the close button.
- **Initial per-item counts:** `StoryItem.engagement?: { likeCount?: number | null; liked?: boolean; reactionCount?:
  number | null; viewerReaction?: string | null; replyCount?: number | null }` seeds the per-item engagement state
  (deltas still apply on top). `null` = withheld (no number).
- **Muted:** sequential moves = auto-advance, tap / arrow / swipe next + previous, cube preview neighbours. Direct open
  (`initialStoryIndex`, `goToStory`) plays a muted group. Nothing un-muted ahead → end-of-last-story behaviour.

## U2 plan — 0.6.0

| Wave | Slice | Owner | Scope | Files (primary) |
|---|---|---|---|---|
| 1 | A — state & data | Sonnet | SV16 controlled `stories` + `onStoriesChange`; delete repair through the prop (+ the removal notice hook-side: pending-removal state, `unavailableNoticeMs`, `standalone`); `onItemViewed` for left items + `cause`; muted groups both directions; SV4 pause-reason model (`pauseReasons` / `onPauseReasonsChange`, `host` / `user` / `hold` / `reply-focus` / `sheet` / `hidden-tab` / `unavailable`) | `hooks/use-story-viewer-state.ts`, `story-viewer.tsx` (state / pause / layer-pause / navigation regions), `types.ts` (Story / props for these), tests |
| 1 | B — engagement, handlers, viewers | Sonnet | SV11 `{ story, item }` handlers + `like` permission + `StoryItem.engagement` seed; inline-type sync with engagement-bar 0.5.0 + type-level assignability test, drop `as any`; **engagement-bar 0.6.0** `onReactionPickerOpenChange` (additive) + story-viewer pauses on it (`sheet` reason via A's API — coordinate through the root's layer flags); `reactors` / `onLoadReactors` removed; SV17 `onLoadViewers(itemId, cursor)` paging + Retry + labels; `viewerCount: number \| null` on Story + StoryItem; owner list resets per item | `lib/kebab.ts`, `lib/engagement-actions.ts`, `lib/permissions.ts`, `hooks/use-story-engagement-state.ts`, `parts/engagement-overlay.tsx`, `parts/owner-overlay.tsx`, `types.ts` (handler / engagement / viewers sections), `data/engagement-bar/*`, tests |
| 2 | C — media pipeline | Sonnet | SV1: optional `src`, `resolveMedia` (current + next only, never previous), frame callbacks `onReady` / `onEnded` / `onProgress(currentTime, duration)` / `onError`, `onMediaError` retry once resuming at the same time; unavailable path for `resolve` / `media` / `timeout` (`loadTimeoutMs`) + `onItemUnavailable`; notice UI (`labels.unavailable`, `labels.unavailableClose`); F-04 seed the timer from the media % after a mid-play error; pinned fetch tests (no previous resolve, no second media element without transition / under reduced motion, no storage / URL writes) | `parts/item-view.tsx`, new `parts/unavailable-notice.tsx`, `hooks/use-story-progress.ts`, `story-viewer.tsx` (progress / media regions), `types.ts` (StoryItem / RenderItemContext / media props), tests |
| 2 | D — presentation & a11y | Sonnet | SV12 caption (`dir="auto"`) + item `createdAt` + `locale` relative time, delete dead `lib/format-time.ts`; SV13 reduced motion (no cube / panel scale, fade); SV14 `--story-viewer-card-w/-h` + `max-height: calc(100dvh - 2rem)` + `navArrowsPlacement`; SV15 labelled previous / next buttons for assistive tech + polite position region; SV18 progress ticks don't re-render the root; SV19 RTL arrow keys / swipe / cube / chevrons; `renderHeaderBadge`; F-03 late-mounting siblings inert while a sheet is open; F-05 reply pill contrast; heart `text-rose-400` → token; media-overlay tokens (`cssVars.theme` mapping on the item, coordinator edits `registry.json`); labels for every remaining string (owner-overlay strings etc.) | `parts/viewer-header.tsx`, `parts/viewer-shell.tsx`, `parts/nav-arrows.tsx`, `parts/tap-zones.tsx`, `parts/progress-bars.tsx`, `parts/reply-composer.tsx`, `hooks/use-cube-transition.ts`, `hooks/use-story-keyboard-nav.ts`, `story-viewer.tsx` (render-tree regions), `types.ts` (labels / presentation props), tests |
| 3 | E — closure | architect | contract baseline rows → 0, `closed` += story-viewer, RTL demo, `describeContract`, `locale="tr"` + hydration tests, demo updates, F-01 (CLI 3.8.5 fixtures) investigation, docs, CHANGELOG (story-viewer + engagement-bar), budgets (story-viewer 240 → 280), registry roster | coordinator files |

### U2 wave 1 results (2026-10-25)

| Slice | Result | Evidence |
|---|---|---|
| A — state & data | done | `__tests__/state-data-0-6-0.test.tsx` 38 tests; controlled `stories` (reported, not applied; id-anchored cursor; parked cube case fixed), delete repair through the prop + removal notice (pending state, `unavailableNoticeMs` 1500, `standalone`), `onItemViewed` `cause`, muted groups both directions, pause-reason model (`user` / `host` / `hold` / `reply-focus` / `sheet` / `hidden-tab` / `unavailable`, controlled pair). Falsified: all CAUGHT except the `onItemUnavailable` call (mutation didn't apply) → slice C falsifies it. Existing tests changed by the contract: `regressions-0-5-2` removal tests → `unavailableNoticeMs: 0` (breaking item 6); `layers-gestures (f)` → host pause persists (breaking item 4) |
| B — engagement, handlers, viewers | done | `handlers-engagement-0-6-0` 12, `viewers-engagement-0-6-0` 15, `engagement-types` 2 (compile-time assignability + `@ts-expect-error` negatives), engagement-bar `picker-open-change` 6; `{ story, item }` handlers, `like` permission (follows `react` unless set), `StoryItem.engagement` seed, type sync (no `as any`), engagement-bar `onReactionPickerOpenChange`, reaction picker as a `sheet` layer, `reactors` removed, viewers paging / Retry / labels / per-item reset, `viewerCount: number \| null` on Story + StoryItem. Falsified, all CAUGHT |
| Coordinator | done | `demo.tsx` `onLoadViewers` → new signature; engagement-bar `meta.ts` 0.6.0 + CHANGELOG bullet |

After wave 1: tsc 0; story-viewer (9 files incl. video-player dependents) 146 passed. Notes for docs: the reply box now
pauses while focused (not only with text); the header pause toggle removes only `user` / `host` (it does nothing visible
while only `reply-focus` / `sheet` hold the pause — parked); a tap during the removal notice ends it early; `"left"` also
fires when a previous-item tap crosses into the previous author.

### U2 wave 2 + closure results (2026-10-25)

| Slice | Result | Evidence |
|---|---|---|
| C — media pipeline | done (+ 1 correction round) | `media-pipeline-0-6-0` 32 tests; new `hooks/use-story-media.ts`, `parts/unavailable-notice.tsx`; `resolveMedia` (items without `src` only; current + next; cache ≤ 8, cleared on close), frame callbacks + `ctx.src` / `ctx.poster`, `onMediaError` one retry (video resumes via VideoPlayer), `loadTimeoutMs`, one notice for every reason, `onItemUnavailable` (falsified — A couldn't). **Architect corrections:** (1) a media failure is unavailable "media" even without `onMediaError` (contract literal; 0.5.4 "failure counts as ready" retired — P2 / P3 tests in `progress-0-5-4` rewritten); (2) an unavailable item is never reported through `onItemViewed`. `seedPct` stays a public option (no viewer use) |
| D — presentation & a11y | done | `presentation-0-6-0` 2 (render count over 40 ticks), `presentation-features-0-6-0` 18; new `lib/progress-store.ts`, `lib/relative-time.ts`, `lib/direction.ts`, `hooks/use-reduced-motion.ts`, `parts/sr-nav.tsx`, `parts/caption.tsx`; `lib/format-time.ts` deleted. **Default header time is now relative** (was a clock time) — added to the breaking list / migration table |
| E — closure | done | `contract-0-6-0` 10 (kit checks, full Turkish label set, controlled `stories` / `pauseReasons`, `locale="tr"`, SSR + hydration, RTL, keyboard, axe on the portalled dialog), `seed-pct-0-6-0` 5; overlay tokens in link-cta / engagement-overlay / kebab-panel / owner-overlay (stage `bg-black` kept — the overlay token is translucent); demo: Muted + RTL (Arabic) tabs, `ctx.src`, badge example; Arabic + muted fixtures |
| Architect | done | owner view count formatted for `locale` (`viewerCountLabel(count, time, formatted?)` — additive third arg) + test, falsified CAUGHT; `registry.json` roster (+8 files, −`lib/format-time.ts`) + `cssVars.theme` media-overlay mapping; contract baseline lowered (0 story-viewer rows) + `closed` += story-viewer (13); `meta.ts` 0.6.0 + budget 280 + features; engagement-bar 0.6.0 meta + CHANGELOG + guide; story-viewer CHANGELOG (breaking list) + guide (0.6.0 section + migration table) + usage |

Story-viewer + video-player dependents after closure: 14 files, 214 + 1 passed; tsc 0.

## U3 — Gates, 0.6.0

First pass (failed, fixed): lint **9 errors** (React Compiler `preserve-manual-memoization` — `openCommentsPanel` /
`openSharePanel` / `closeLayer` had `[]` deps around state setters) + 5 new warnings (unused test vars / helper, a `_drop`
destructure, a stale `eslint-disable`, `noopProgress` params, missing `pendingRemoval` dep) → setters listed in the deps,
warnings fixed, story-viewer lint 0 / 0. `registry:build` stopped at `validate-barrel-exports --strict`: 2 high —
`StoryItemViewedCause`, `StoryViewerPendingRemoval` referenced by exported types but not exported → added to `index.ts`
(with `StoryViewerPauseReason`). Repo tests failed downstream of the stale artifacts (served versions, stamps) plus
5–26 s timeouts under memory pressure (`next build` took 734 s on that run). tsc 0 throughout. Lesson: slice briefs must
also run `pnpm exec eslint <folder>` — tsc + vitest don't see React Compiler bail-outs.

Second pass (after the fixes): tsc 0 · lint 0 errors · `registry:build` 0 — artifact `story-viewer.json` **312.32 KB**
over the 280 KB budget → budget raised to **320** (growth is the contracted features + their JSDoc; nothing shipped by
accident — no `__tests__`, demo, usage or meta in the artifact) · doc-budget 0 · tests **1682 passed / 124 files** ·
`pnpm build` OOM twice (Windows commit limit, `Zone Allocation failed`) → host memory freed by the user → build **0**
(compiled in 31 s, 77/77 pages).

## U4 — Adversarial review, 0.6.0 (1 fresh Sonnet finder, code on a frozen snapshot + the diff vs 0.5.4)

| # | Finding | Verdict |
|---|---|---|
| U4-1 ⚠️ | every `goToNextItem` reports `cause: "completed"` — a tap / ArrowRight / screen-reader "next" at 0.5 s counts as completed; the platform counts only items played to the end | CONFIRMED → cause per caller: timer end + video end `"completed"`, every manual or handle move `"left"` |
| U4-2 ⚠️ | `onMediaError` and `RenderItemContext.onError` JSDoc still describe the 0.5.x "counts as ready" path; the code (and the guide) make the item unavailable | CONFIRMED → both JSDoc blocks rewritten (architect) |
| U4-3 🔸 | `loadTimeoutMs` runs while the viewer is held paused → a paused, not-yet-ready item times out | CONFIRMED → armed only while no reason but `unavailable` is held; restarts on resume |
| U4-4 🔸 | inline image ref re-runs every render; a failed `<img>` has `complete === true` → marked ready during a pending `onMediaError` | CONFIRMED → `naturalWidth > 0`, once per element |
| U4-5 🔸 | removal repair ignores `Story.muted` | CONFIRMED → repair skips muted groups |
| U4-6 🔸 | host removes an item in response to `onItemUnavailable` → second 1.5 s notice + duplicate `"removed"` event | CONFIRMED → the showing notice counts |
| U4-7 🔸 | a `renderItem` text frame with no `src` and no `resolveMedia` is unavailable "resolve" at once (unlisted break) | CONFIRMED → frame owns src-less items when there is no resolver; guide |
| U4-8 🔸 | reaction picker is missing from the "outside press only dismisses" guard → dismiss tap also advances | CONFIRMED → guard covers the picker |
| U4-9 🔸 | owner overlay time chip uses `story.createdAt` only (header uses the item's) | CONFIRMED → same fallback |
| U4-10 🔸 | owner overlay `left-0 right-0` (physical) | CONFIRMED → `inset-x-0` |
| U4-11 🔸 | `like` follows `react` whenever `canLike === canReact`, even when `canLike: true` was set explicitly | CONFIRMED → explicit-ness tracked from the raw prop |
| U4-12 🔸 | docs say "fade" under reduced motion, code switches instantly; guide says `setPaused(true)` persists until `setPaused(false)` but a middle tap / Space / header button also resume | CONFIRMED → fade implemented (the contract promised it); wording fixed in guide + CHANGELOG |
| U4-13 🔹 | with `resolveMedia`, the neighbouring author's swipe preview is blank (resolve window = current + next item) | CONFIRMED, by design → documented |
| U4-14 🔹 | `StoryItem.engagement` seed is frozen after the first interaction | CONFIRMED, by design → documented |
| U4-15 🔹 | `host` pause survives close → reopens silently paused | CONFIRMED → close clears `host` (a pause set while closed still holds on open) |
| U4-16 🔹 | controlled `pauseReasons`: a host update landing in a later task leaves a window where a second add drops the first | PARKED → follow-up (narrow; the fix touches same-task compounding) |
| U4-17 🔹 | `disableTapZones` also removes the screen-reader nav | CONFIRMED → mounted independently |
| U4-18 🔹 | reaction picker stays open across a cursor change | CONFIRMED → reset with the other layers |
| U4-19 🔹 | cube ghost header omits the badge; `currentUser as any` in the reply composer | CONFIRMED → badge passed; cast typed |

Fixes: two Sonnet implementers in parallel (X state / media: 1, 3, 5, 6, 7, 11, 15 · Y presentation: 4, 8, 9, 10, 12,
17, 18, 19), each fix test-first and falsified.

U4 fixes landed: X 7 fixes (`u4-state-media-0-6-0`, all CAUGHT; one existing assertion corrected — a tap-next at 0 s
is `"left"`), Y 8 fixes (`u4-presentation-0-6-0` 11 tests, all CAUGHT; the picker guard also exempts the portalled
popover content / trigger; the picker closes on a cursor change by remounting the bar). Battery after both: tsc 0 ·
lint 0 errors · registry:build 0 (story-viewer **318.16 / 320 KB**) · doc-budget 0 · tests **1712 passed / 126 files**.

## U5 — Runtime & smoke, 0.6.0

**Browser (fresh Sonnet finder, Playwright Chromium, production build on `next start -p 3200`, pre-U4-fix build):**
PASS — muted skipping both ways (arrows / keys / taps / auto-advance); unavailable notice (image + video 404: polite
status, bars frozen, moves on at ~1.55 s, not reported viewed; Escape during it closes cleanly); relative time + Arabic
(`قبل ساعتين`), RTL mirroring (keys, tap zones, bars, chevrons); reduced motion mounts no cube / second media; SR nav
(Tab, Enter / Space, polite atomic position); owner chip + `onLoadViewers(itemId, null)` loading → list, Escape closes
only the list; reaction picker pauses, Escape closes only the picker, focus returns; `{ story, item }` payloads on all
kebab / engagement handlers; reply pill legible in dark (0.5.4 B-6 fixed); 0.5.4 regressions all hold; engagement-bar
picker + post-card fine; 12 tabs × light / dark × 1280 / 390 no overflow, console clean.

| # | Finding | Verdict |
|---|---|---|
| B-1 ⚠️ | desktop story nav arrows never visible — the shell's `[&>button.absolute]:hidden` (hides the dialog's own close button, since 0.2.1) out-specifies `md:flex`; `navArrowsPlacement` therefore does nothing | CONFIRMED → selector excludes `[data-story-nav-arrow]` (an inert surface otherwise) |
| B-2 🔸 | header illegible on a bright photo — no top scrim | CONFIRMED → top gradient scrim on the overlay token |
| B-3 🔹 | Arabic demo still shows English (position, engagement, panel strings) | CONFIRMED (demo) → Arabic labels |
| B-4 🔸 | viewer-mode Tab skips the heart toggle; Tab from it bounces back — the dialog focus scope ignores `inert` (same cause as 0.5.4 B-1) | CONFIRMED → `wrapTabWithinLayer` at the dialog level |
| B-5 🔹 | focus on `body` after close in the demo | DROPPED — host / demo concern (0.5.4 B-5) |
| B-6 🔹 | initial focus lands on the visually-hidden "Previous item" | CONFIRMED (new, SR nav) → focus the dialog content on open |
| B-7 🔹 | viewers list doesn't move focus in | DROPPED — non-modal by design (0.5.4 B-2) |
| B-8 🔹 | demo fixtures' fixed `NOW` → the demo shows absolute dates, never the relative time | PARKED → demo follow-up |

Untested in the browser (unit-tested instead): direct open on a muted group, `loadTimeoutMs`, owner thousands format,
load-more / empty / Retry.

**Installs (pre-U4-fix artifacts):** CLI 4.18.0 all checks pass (story-viewer, fixtures, engagement-bar, post-card;
consumer tsc 0). CLI 3.8.5: fixtures added after the base write nothing (the known pre-existing F-01 case; the harness
page then fails tsc on the missing `dummy-data`). Re-run after the fixes, plus the documented fixtures-alone path.

U5 fixes (1 Sonnet implementer, `u5-browser-0-6-0` 6 tests, all CAUGHT): B-1 shell selector
`[&>button.absolute:not([data-story-nav-arrow])]:hidden` (arrows visible at `md+`, `navArrowsPlacement` works); B-2
header scrim (`from-media-overlay`, `pointer-events-none`, behind the controls); B-4 `wrapTabWithinLayer` on the dialog
when no layer is open + `tabbablesIn` skips `display:none` / `visibility:hidden` (the CSS-hidden built-in close button
was the last DOM tabbable); B-3 Arabic demo labels (viewer, engagement, comment composer). **Architect correction on
B-6:** the implementer used `onOpenAutoFocus` — Radix-only (F-cross-13; Base UI would get an unknown DOM prop and no
effect) → replaced by a two-frame effect in the shell that focuses the content when focus sits on the dialog's own
auto-focus target (with the arrows visible again that is the "Next story" arrow on desktop, the hidden SR button on
mobile); test now `waitFor`, falsified CAUGHT. Budget 320 → **340** (the U4 / U5 fixes put the artifact at the cap).

**Browser re-verify (fresh Sonnet finder, production build after every fix):** PASS — arrows 48×48 visible at 1280,
next / prev move authors, built-in close stays hidden, arrows hidden at 390, RTL next arrow on the left; header legible
on a near-white photo (light + dark), scrim doesn't block taps; Tab visits every control incl. "Show reactions", wraps,
never `body` / inert / stuck, Shift+Tab reverses; focus on open = the dialog (1280 + 390); reduced-motion fade (opacity
0 → 0.58 → 0.80 over ~200 ms, 0 `matrix3d`, 1 media element); picker dismiss tap doesn't advance, picking registers,
trigger toggles; Arabic chrome / overlay / sheets have no Latin words; owner chip + full-width bar + viewers list;
console clean, no overflow. New: R-1 🔹 Tab at 0 ms spacing skips the heart (PARKED, F-05) · R-2 🔹 long badge squeezes
the username at 390 (PARKED, F-06) · R-3 focus to `body` after close (DROPPED, as B-5) · R-4 SR buttons focusable
(by design).

**Installs (final artifacts):** CLI 4.18.0 all checks pass (story-viewer, fixtures, engagement-bar, post-card; tsc 0).
CLI 3.8.5: fixtures after the base write nothing (F-01, pre-existing); fixtures alone + engagement-bar + post-card —
all checks pass, consumer tsc 0 (the documented path).

## U6 — Docs & review, 0.6.0

Guide (U4 / U5 wording: viewed causes, pause reasons, resolve window, engagement seed, viewer focus), `meta.ts`
features (fade, scrim, Tab wrap, timeout), CHANGELOG (fixed items), STATUS rows + recent activity, decision
`.claude/decisions/2026-10-25-story-viewer-v0-6-0.md`, review
[`reviews/2026-10-25-v0.6.0-platform-contract.md`](reviews/2026-10-25-v0.6.0-platform-contract.md): **Pass with
follow-ups** (6, owned). engagement-bar review `reviews/2026-10-25-v0.6.0-picker-open-change.md`: **Pass**. Final
consistency: roster = folder (39 / 21 files), versions agree (meta, artifacts, component-versions `--check`, STATUS),
tsc 0 · eslint 0 · doc-drift 0 · inert-surfaces 64 / 64 clean · meta-deps 0 · doc-budget 0.

## U7 — Ship, 0.6.0

Commit `c89aac2` (with the docs commits `bbe5cff`, `e87ee58`), pushed under the user's Part 3 grant after the final
consistency review. Live poll (≥ 150 s apart): 0.5.4 / 0.5.0 at +3 and +6 min, **0.6.0 / 0.6.0 at +9 min**. Live
`story-viewer.json`: 38 files, no tests, `hooks/use-story-media.ts` + `lib/focus-wrap.ts` present, `lib/format-time.ts`
gone, the nav-arrow selector fix in, `cssVars.theme` media-overlay mapping. Decision `shipped`; retro in
`.claude/improvement-log.md`; report-back `.claude/report-back-2026-10-25-story-viewer-0-6-0.md` (to the user for the
platform). **Next release:** media-editor 0.5.0 + story-composer 0.6.0 — on the user's go.

---

# Run — 0.6.1 (Part 3 release 5, with comment-thread 0.4.0 + post-card 0.6.0)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **patch** — no public API removed; one optional label added) |
| **Current stage** | CLOSED — shipped in the release 5 commit `424f34a`, live-verified 2026-10-26 (record: `docs/procomps/comment-thread-procomp/comment-thread-loop.md`, "Run — Part 3 release 5") |
| **Sign-off policy** | user go 2026-10-26 ("update story-viewer to use comment-thread 0.4.0 … end to end"); platform constraint from `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-26_ME051_FB_EP.md` |
| **Version target** | v0.6.0 → **v0.6.1** |

## U0 / U1

- **Why:** comment-thread 0.4.0 changes the composer contract (a rejected post keeps the draft and shows
  `labels.postFailed`). The platform asked that story-viewer keep working on 0.4.0 or move in the same release.
- **Change:** the reply box runs on comment-thread 0.4.0. A rejected `onAddReply` keeps the typed text and shows
  `labels.replyFailed` (or `labels.commentLabels.postFailed`) under the box on a media scrim; the story stays paused
  while the draft is there; the rejection is handled (it was unhandled). `labels.commentLabels.composerPlaceholder`
  now reaches the reply box while `replyComposerPlaceholder` is left at its default (it had no effect); an explicit
  `replyComposerPlaceholder` still wins.

## U2–U6

- Built by the architect (`types.ts` label + `StoryReplyComposerLabels.postFailed`, `parts/reply-composer.tsx`).
  Test `__tests__/reply-failure-0-6-1.test.tsx` (5), falsified. The placeholder change first broke the contract test
  (an explicit placeholder lost to the comment label) — fixed with the explicit-wins rule.
- U4: read by the release's two code finders (story-viewer rows: none open after the fix waves).
- U5: browser regression sweep "story-viewer failed reply" PASS; demo close-focus parked (W8, host-owned `isOpen`).
  Installs: final matrix on CLI 4.18.0 + 3.8.5 (6 runs, all PASS, consumer tsc 0 — see comment-thread-loop.md "U5 — installs").
- U6: `meta.ts` 0.6.1, CHANGELOG bullet, guide section "v0.6.1". Artifact 321.7 / 340 KB.

### U7 — Ship (release 5)

Commit `424f34a`, pushed 12:52 under the user's Part 3 grant after the final consistency review. Live poll (180 s apart): old versions at +3 / +6 / +9 min, **all six new at +12 min** (comment-thread 0.4.0, comment-thread-moderation 0.4.0, post-card 0.6.0, story-viewer 0.6.1, engagement-bar 0.6.1, news-card 0.4.5). Detail: comment-thread-loop.md "U7 — Ship".

# Run — 0.6.2 (a11y / bug patch from the platform request of 2026-10-27)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **patch** — no public API added or removed; behaviour fixes + one JSDoc fix) |
| **Current stage** | CLOSED — shipped with release 7 in `bc3089f`, live-verified 2026-10-28 |
| **Sign-off policy** | patch → architect proceeds (ladder). User chose this patch 2026-10-28 ("1. a"): ship it in parallel with release 7, ahead of story-viewer 0.7.0 |
| **Version target** | v0.6.1 → **v0.6.2** |
| **Model roster** | architect: main session · implementer: Sonnet 5 · review: architect self-check (patch) |
| **Started / updated** | 2026-10-28 / 2026-10-28 |

## U0 — Intake & impact

- Source: `.claude/platform-request-verification-2026-10-28.md` §Group 3 (asks SV-1, SV-4 (2) (4) (6) (10) (11), plus
  two defects we found: the header scrim over the bars and focusable buttons inside `aria-hidden` ghost faces).
- **Blast radius:** story-viewer only. No dependents compose story-viewer (`registry.json` grep: no item lists
  `@ilinxa/story-viewer`). It composes comment-thread (`CommentComposer`) and engagement-bar (inline-copied types) —
  untouched. Docs: `meta.ts`, CHANGELOG, guide "v0.6.2" section, STATUS row, component-versions.
- Owed follow-ups overlapping this touch: none of 0.6.0 F-01…F-06 is in scope (F-02, the `pauseReasons` late-update
  drop, stays parked — note it in the guide's known issues is already done).
- Loop rows B-5 / R-3 / 0.6.1 W8 ("focus lands on body after close — host concern") are **reversed** by this run.

## U1 — Change contract (patch; recorded, no pause)

Reproductions (write before fixing; U5 replays them):

| # | Reproduction | Expected after fix |
|---|---|---|
| R1 | Open the viewer from a host button (no `DialogTrigger`), close with X / Escape / auto-close | Focus returns to the element that was focused when the viewer opened, if it is still connected and focus would otherwise be on `body`; no double focus when the backend (Base UI) already restored it. The false comment in `parts/viewer-shell.tsx` is corrected. |
| R2 | axe on an open viewer with a 3-item story | No `aria-progressbar-name`: only the current segment is `role="progressbar"`, named by the existing `labels.position(author, index, total)`; the other segments are `aria-hidden`. |
| R3 | Story on a pure-white image | The bars are visible: they sit above the header scrim (not under it) and carry a subtle shadow. Pure-black image unchanged. |
| R4 | Drag the cube (ghost faces mounted), Tab | No focusable element inside an `aria-hidden` ghost face (`inert` on the ghost wrappers). |
| R5 | Unavailable notice showing, then a host pause reason (e.g. `sheet`) arrives | The notice timer stops while any OTHER pause reason holds and resumes with the remaining time after; same for the removal notice. |
| R6 | Long-press on the card, release the mouse outside the card / alt-tab | The hold ends on window `pointerup` / `pointercancel` / `blur`; the story resumes. |
| R7 | Unavailable / removal notice showing, press Play / Space / middle tap zone | The notice ends early (advances as if its timer elapsed). |
| R8 | `onItemViewed` JSDoc | Says taps report `"left"`, not `"completed"`; matches the guide. |

Invariants that must still hold: every existing story-viewer test; `pauseReasons` controlled-mode semantics; reduced
motion; the 0.6.1 reply-failure behaviour; RTL; the cube/swipe thresholds; `renderProgress` replaces the bars entirely
(the new naming applies to the default bars only).

Deferred to 0.7.0 (minor): SV-4 (8) hide failed media, (13) `left` at auto-close + item on `onAutoCloseAtEnd`,
`returnFocusTo`, `--story-viewer-progress-height`, and every feature ask.

## U2–U6 (2026-10-28)

- **U2:** Sonnet implementer, R1–R8 at source; `__tests__/a11y-bugs-0-6-2.test.tsx` (16), each fix reverted → its test
  failed, restored → 16 / 16. `progress-0-5-4.test.tsx` L106 updated (only the current segment is a progressbar now —
  the regression it guards still asserts). The architect added the release-7 EB-1 wiring to this patch (same push):
  sheet ids, `commentDisclosure` / `shareDisclosure`, `__tests__/disclosure-0-6-2.test.tsx` (3; wiring removed → 2
  fail), inline-type parity samples for comment / share.
- **U3:** see the release-7 battery in `comment-thread-loop.md` (artifact 329.7 / 340 KB).
- **U4:** finder B (fresh Sonnet) read R1–R8: no Blocker / High; two edge rows → follow-ups **FU-3** (removal notice
  after a paused media notice uses wall-clock remaining time) and **FU-4** (Play does nothing during a notice on a
  single-item, stay-until-closed story) — story-viewer 0.7.0.
- **U5:** browser finder: R1 (X / Escape / auto-close, click / Enter / Safari-like click with the opener focused), R2
  (one named progressbar, axe clean for it), R3 (bars visible over a white image), R4 (no focusable inside
  `aria-hidden` ghosts, idle / mid-drag), R6, R7, sheet disclosure — all pass. New pre-existing row **FU-5**: the
  link-drawer opener's `aria-label` ("Shop now") does not match its visible text (axe
  `label-content-name-mismatch`) — story-viewer 0.7.0. Installs: `comment-thread-loop.md` "U5 — installs".
- **U6:** guide "v0.6.2 — accessibility fixes", CHANGELOG bullet, `meta.ts` 0.6.2, STATUS row. Patch → no review
  file required (rigor ladder); the EB-1 wiring is covered by engagement-bar's 0.7.0 spot-check.

## U7 — Ship (0.6.2, with release 7)

Commit `bc3089f`, pushed 19:51 UTC on the user's "Push" (2026-10-28). Live poll (180 s apart): Vercel pending and old artifacts at +3 / +6 / +9 min; **build success and all four new at +12 min** — `engagement-bar.json` serves `hideZeroCounts`, `comment-thread.json` `getAuthorHref`, `post-card.json` `PostInlineDisclosure`, `story-viewer.json` the last-pressed opener fallback. Detail: comment-thread-loop.md "Run — release 7".

# Release 7b — dependent check (no story-viewer change)

story-viewer is byte-identical in release 7b. It composes engagement-bar 0.8.0 (inline action-type copy: a subset by
design, guard `__tests__/engagement-types.test.ts` green) and comment-thread 0.6.0 (`CommentComposer` props + handle
unchanged; only an optional `size` added). Re-checked: story-viewer tests green in the final battery; installs on CLI
4.18.0 and 3.8.5 PASS (consumer tsc 0); browser — viewer, comments sheet, reply, close with no console errors. Found
pre-existing: Escape on the comments sheet leaves focus on `<body>` → FU-8, story-viewer 0.7.0 (release 9). Record:
`docs/procomps/comment-thread-procomp/comment-thread-loop.md` → "Run — release 7b".

# Run — release 9 = 0.7.0 (platform request 2026-10-27, group 3 features)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive props / handle method / type members; two behaviour changes listed under U1) |
| **Current stage** | U7 — ship (GATE 3 Pass with follow-ups; battery, browser pass, installs and doc check done) |
| **Sign-off policy** | U1 minor → **delegated by user** ("go and close it end to end", 2026-10-29). Not a breaking change to a composed component: no registry item depends on story-viewer (U0). |
| **Version target** | v0.6.2 → **v0.7.0** |
| **Model roster** | architect: main session · implementers: 2 × Sonnet 5 (slices M, N) · finders: 2 × fresh Sonnet 5 (code + browser) |
| **Started / updated** | 2026-10-29 / 2026-10-29 |

## U0 — Intake & impact

- Source: `.claude/platform-request-verification-2026-10-28.md` §Group 3 (wins over the request) + the request's SV-2/3/4/5/6
  text (`E:/tmp/social-ui-v2/PROUI_REQUEST_2026-10-27.md` L211-262) + `PROUI_NOTE_M7A_STORY_VIEWER.md` asks 1-13.
  Scope = SV-2, SV-3, SV-5, SV-6, SV-4 (1) (3) (4) (5) (6 `returnFocusTo`) (7) (8) (9) (13), the progress-height
  variable (SV-1 rest), and owed follow-ups FU-3, FU-4, FU-5, FU-8.
- Not taken: `labels.progressSegment` (0.6.2 already names the current bar with `labels.position(author, index,
  total)`; a second label for the same string would be a duplicate) — said in the reply.
- **Blast radius:** story-viewer only. `registry.json`: no item lists `@ilinxa/story-viewer`. It composes comment-thread
  (`CommentComposer`) and engagement-bar (inline type copy) — not touched. Docs: `meta.ts`, CHANGELOG, guide (0.7.0
  section + migration notes), description/plan API delta note, STATUS row, component-versions, demo/usage.
- Fix-on-touch ledger: no row for story-viewer. 0.6.0 F-02 (`pauseReasons` late-update drop) stays parked.

## U1 — Change contract (minor; sign-off delegated)

Public types written first by the architect in `types.ts` (the contract): `StoryItem.srcSet/sizes`,
`StoryResolvedMedia.srcSet/sizes/maxAgeMs/expiresAt`, `StoryBackdropContext`, `RenderItemContext.srcSet/sizes`,
`StoryItemViewedInfo`, `StoryViewerHandle.invalidateMedia`, props `initialItemIndex`, `returnFocusTo`, `onItemReady`,
`onItemViewed` 5th arg, `onAutoCloseAtEnd(storyId, itemId)`, `extraKebabActions`, `storySwipe`, `backdrop`,
`renderBackdrop`, `preloadNext`, `StoryKebabMenuItem.hidden`. Zero-arg / 4-arg host callbacks stay assignable.

**Behaviour changes (minor, documented as migration notes):**
1. `onItemViewed` now also fires on `goToItem` / `goToStory` (handle), on close (`"left"`, direction `"close"`) and for
   the last item before the auto-close (forward move past the last author). A host that also marks in
   `onAutoCloseAtEnd` gets the item twice (idempotent marks are unaffected).
2. `onMediaError` may be asked again for the same item after a retried URL LOADED and then failed (was: once per item).

Reproductions / acceptance (U2 writes a failing test first for each; U5 replays the browser-only ones):

| # | Ask | Reproduction | Expected after |
|---|---|---|---|
| A1 | SV-4(3) | open with `initialStoryIndex=1, initialItemIndex=2` (resolveMedia spy); close; reopen at 0/0 | opens on item 2; `resolveMedia` never called with items 0/1 of that story; no render of a stale cursor on reopen; clamps out-of-range |
| A2 | SV-4(4)(13) | tap back; `goToItem(0)` from 2; X close; play-through of last item of last author; tap forward on it | back → `left/backward`; goToItem → `left/backward`; X → `left/close`; play-through → `completed/forward` then `onAutoCloseAtEnd(sid, iid)`; tap forward on last → `left/forward` then `onAutoCloseAtEnd`; each item fires once per visit |
| A3 | SV-4(1) | open with `pauseReasons=["host"]`, image loads, then clear | `onItemReady` not before the clear; once after; again on revisit; never for an unavailable item |
| A4 | SV-4(6) | `returnFocusTo={el}` / fn→null / `false` | focus goes to `el` / opener / untouched |
| A5 | SV-4(7) | `disableStoryTransition` alone; + `storySwipe`; `storySwipe={false}` alone | no swipe (0.6 compat); swipe = hard cut with no ghost faces mounted, RTL mirrored, not from controls; cube without swipe gesture |
| A6 | SV-5 | `extraKebabActions` w/o `viewerMode`; `hidden` item; with `kebabActions` | kebab shows with the extras; hidden left out (also in defaults/moderator/takeover lists); takeover ignores extras |
| A7 | progress var | set `--story-viewer-progress-height: 6px` | default bars 6 px; unset = 2 px |
| A8 | FU-3 | media notice paused by a sheet, then removal notice | removal notice gets its full time from when nothing else holds (no wall-clock leak) |
| A9 | FU-4 | standalone single-item story, unavailable notice | no dead Play: the play/pause control and middle-tap pause are not offered while a stay-until-closed notice shows |
| A10 | FU-5 | link with `cta="Shop now"` | opener accessible name contains its visible text (axe `label-content-name-mismatch` clean) |
| A11 | FU-8 | open comments sheet, Escape | focus returns to the comment button (not `body`) |
| B1 | SV-6 | resolveMedia → `{src, srcSet, sizes}`; then image error + `onMediaError` new src | `<img srcset sizes>`; after retry no `srcset` (only new `src`); `ctx.srcSet` for a custom frame |
| B2 | SV-4(5) | retry URL loads, later fails | host asked again; retry URL failing BEFORE load → unavailable, not asked twice; video same |
| B3 | SV-4(8) | image `error` with a pending `onMediaError` | failed `<img>` hidden at once (no broken glyph); ghost-face img error hidden too |
| B4 | SV-4(9) | result `maxAgeMs: 1000`; long pause on current; move next / revisit | next/revisited item resolved again; current never swapped; `invalidateMedia(itemId)` → re-resolve on next need; negative cache retried once when the failed item becomes current; retry URL reused on revisit; `videoMetadataMs` keyed `storyId:itemId`, cleared on close |
| B5 | SV-3 | delayed image next; `preloadNext={false}`; `saveData` | `Image()` + `decode()` for next once its URL is known, no DOM node; video = off-DOM metadata only; nothing for previous; off when disabled / saveData |
| B6 | SV-2 | `backdrop="ambient"` desktop; reduced motion; video w/o poster; `renderBackdrop` | layer under the overlay with the stage's loaded URL (no new request); dim before ready / no poster / reduced motion; outside-click still closes; hidden < md; slot wins |

Invariants (regression targets): every existing story-viewer test (19 files); `pauseReasons` controlled semantics;
reduced motion; RTL; cube thresholds; 0.6.2 a11y fixes (opener focus, named current bar, inert ghosts, notice pause,
hold release, Play ends notice); resolve window = current + next only; `renderItem` frame contract; F-cross-13 (no
Radix-only props).

## U2 — Implement

| Slice | Owner | Files (exclusive) | Rows |
|---|---|---|---|
| M media | Sonnet 5 | `hooks/use-story-media.ts`, `parts/item-view.tsx`, `parts/story-cube-face.tsx`, new `parts/ambient-backdrop.tsx`, new `lib/preload.ts`; `story-viewer.tsx` media regions | B1-B6 |
| N navigation / chrome | Sonnet 5 | `hooks/use-story-viewer-state.ts`, `hooks/use-long-press-pause.ts`, `parts/viewer-shell.tsx`, `parts/progress-bars.tsx`, `parts/link-cta.tsx`, `parts/bottom-sheet.tsx`, `parts/comments-panel.tsx`, `parts/share-panel.tsx`, `parts/viewer-header.tsx`, `parts/tap-zones.tsx`, `lib/kebab.ts`, `parts/kebab-panel.tsx`; `story-viewer.tsx` nav/kebab/swipe/handle regions | A1-A11 |

`types.ts` / `index.ts` / `meta.ts` / docs: architect.

### U2 results (2026-10-29)

- **Slice M** (Sonnet): B1–B6 at source; `__tests__/media-0-7-0.test.tsx` (25), each row reverted by a mutation script →
  its tests failed, restored → green. New files `lib/preload.ts`, `parts/ambient-backdrop.tsx` (`react-dom`
  `createPortal`; not declared — catalog precedent, `react-dom` is never a declared registry dep; meta-deps exit 0).
  `use-story-media.ts` rewritten: results carry an expiry; an aged-out NEXT result re-resolves (wake-up timer, 500 ms
  re-fetch floor so `maxAgeMs: 0` cannot spin); the on-screen item is never swapped (`invalidateMedia` parks the fresh
  answer in `entry.next` until the item is left); a retried video URL is echoed into `src` (video-player resumes into
  an echoed refresh URL by design, `use-video-state.ts` L171-184).
- **Slice N** (Sonnet): A1–A11 at source; `__tests__/nav-0-7-0.test.tsx` (42); four 0.6 test files updated for the 5th
  `onItemViewed` argument and the link chip selector (A10 dropped its `aria-label`). Newly firing: a back tap inside a
  story (`left` / `backward`) — recorded as a behaviour change. `story-viewer.tsx` was edited by both slices; the
  coordinator re-grepped every slice-M wiring point after slice N's whole-file edits (all present).
- **Coordinator spot-check** (riskiest functions read in full: `use-story-media.ts`, the state hook's seed + `fireViewed`,
  `ambient-backdrop.tsx`, `preload.ts`): one defect fixed by the architect — opened on an empty list, the seed key was
  consumed with nothing to seed, so `initialItemIndex` was lost when the stories arrived (slice N had parked it).
  Fix: the key stays unmatched until a story exists; test "opened before the data arrives…" (fails with the old line,
  verified). Noted for review: `videoMetadataMs` re-key has no failing-without-fix test (the cached value is only read
  for a video whose metadata duration is invalid).
- Parked by implementers (→ U4 to judge): stale `swipeRef` after a mouse release outside the card (pre-existing,
  widened by `storySwipe`); `KebabPanel` has no last-pressed opener fallback (Safari); ghost-face `<video>` has no
  hide-on-error; A11's original browser cause not reproduced in jsdom (browser pass).
- Coordinator: `registry.json` +2 files (roster diff clean after), `meta.ts` 0.7.0, CHANGELOG, guide 0.7.0 section +
  migration table + handle section, demo tab "Backdrop + events" + `storySwipe` toggle, STATUS row.

## U4 — Adversarial review (fresh Sonnet finder, code; static — its test runs hit worker timeouts during the battery)

| # | Finding | Sev | Verdict | Action |
|---|---|---|---|---|
| F1 | An aged-out NEXT result is re-asked while the viewer sits on the current item (once per lifetime, floor 500 ms) — JSDoc said "next time it needs the item" | 🔸 | CONFIRMED (doc) / behaviour kept | Kept on purpose: it is the platform's "long pause, then move on" case (M7A ask 9, S4). JSDoc + guide now say it, with the 500 ms floor |
| F2 | Ambient backdrop never cross-fades: `isReady` is false between items, so the layer passes through dim | 🔸 | CONFIRMED | `loading` prop: the shown image holds while the next item loads (not when it is unavailable / a removal frame), then two layers for one fade; test (fails without: layer list empties on the item change) |
| F3 | `kebabActions` without `viewerMode` now renders the menu (0.6: none) | 🔹 | CONFIRMED (behaviour change, intended by the JSDoc) | Migration row added; stale legacy-mode comment in `lib/kebab.ts` fixed |
| F4 | `bg-black/50` literal in the backdrop | 🔹 | CONFIRMED | `bg-media-overlay` token |
| F5 | Edited 0.6 test "goToItem leaves with left" asserted only a negative | 🔹 | CONFIRMED | Positive `left` / `forward`, called once |
| F6 | A stale video `timeupdate` from the failed URL could re-arm the retry before the retry URL loaded | 🔹 | CONFIRMED (timing) | `markLoaded` counts only when the stage `src` is the awaited retry URL |
| F7 | Reopen on an EMPTY list renders the previous session's cursor (possible spurious removal notice) | 🔹 | CONFIRMED pre-existing (HEAD's effect-based reset returned early the same way) | Follow-up FU-9 (story-viewer next minor) |

Checked and found correct by the finder (static): `onItemViewed` dedupe and directions on every path, auto-close
ordering, unavailable guard on close, `initialItemIndex` clamping, `onItemReady` gating, resolve ticket races,
`invalidateMedia` on-screen parking, image retry gating, video echo vs `use-video-state.ts`, srcSet drop, preload
scope, backdrop SSR / z-order / click-through, `returnFocusTo` (no Radix-only props), sheet fallback, swipe gating, kebab
`hidden`, A8 clock, A9 / A10 tests.

## U5 — Runtime: browser finder (fresh Sonnet, Chromium / Playwright on `next start -p 3200`; WebKit not runnable — Playwright 1.62.1 wants webkit-2336, 2248 installed)

Passed in the browser (numbers in `E:/tmp/ilinxa-release-kit/browser-r9/`): ambient backdrop under the z-50 overlay
(z-40, child of `body`), same URL as the stage `currentSrc`, requested once, cross-fade 2 layers → 1 at ~300 ms,
outside click closes, `display:none` at 390, none under reduced motion / dim; opens on the chosen item; every event
line (`completed forward`, `left backward`, `left forward`, `left close` for X and Escape, last author `completed
forward` + `auto-close`); `ready` not while paused; kebab extras without `viewerMode`, `hidden` left out, focus back on
the trigger; swipe matrix (cube+swipe, hard cut with no ghost faces, controls exempt, cube without drag, RTL mirrored,
hold released off-window and on blur); srcset/sizes, preload before current with no DOM node, no broken-image frame,
retry without srcset, gone notice + negative-cache retry, `maxAgeMs` 3 s re-resolve once per lifetime, invalidate
without a blank; standalone notice without Play, Space inert, Close returns focus; default opener focus 12/12;
progress 2 px / 6 px; A10 axe clean; 11 demo tabs axe-clean, zero console errors at both widths.

| # | Finding | Sev | Verdict | Action |
|---|---|---|---|---|
| F-1 | Paused, then moved onto a video: header says playing, `<video>` stays paused at 0, bar never fills | ⚠️ | CONFIRMED, **pre-existing** (identical on live 0.6.2, `f1-compare.mjs`); wider than reported: **any pause + resume of a video froze it** (`f1-resume.mjs`: t=2.28 before and after, live too). `isActive={false}` pauses the player; nothing ever called `play()` | Fixed in `parts/item-view.tsx`: the player handle's `play()` on every paused → playing change; 2 tests (both red without) |
| F-2 | Mouse click on the comments / share sheet's own close button leaves focus on `body` (Escape and keyboard fine) | ⚠️ | CONFIRMED (`f2-probe.mjs`: the press collapsed the reactions rail → the comment action `inert`) | The rail's outside-press ignores presses inside `[data-story-layer]`; test with the real pointerdown sequence (red without) — slice N's close-button test fired only `click` |
| F-3 | Owner mode view-count chip: `aria-label` "47 views · May 3, 2026" vs visible "47· May 3, 2026" (axe `label-content-name-mismatch`) | 🔸 | CONFIRMED, pre-existing (owner overlay untouched) | Follow-up FU-10 (next minor: the name comes from the host's `labels.viewerCountLabel`, so the fix touches the label contract) |
| F-4 | Swipe commits at 30 % width / 0.5 px·ms, the brief said 60 px | — | DROPPED (brief error; the guide documents 30 % / velocity) | — |
| F-5 | Actions button has no `aria-haspopup` / `aria-expanded` | 🔹 | CONFIRMED, pre-existing | Fixed: `aria-haspopup="menu"` + `aria-expanded`; test |

Not runnable here: WebKit (the Safari opener fallback, A4 / A11) — platform side, as in release 8.

Browser replay of the fixes on a rebuilt production server (`f1-resume.mjs`, `f1-compare.mjs`, `f2-probe.mjs`, `t3b.mjs`):
pause → resume t 2.26 → 3.79 playing; paused move onto a video plays (t 2.42 → 6.42, bar 23 → 63); mouse close of the
comments sheet → focus on "Comment", rail still expanded, no `inert` ancestor; actions button `aria-haspopup=menu
aria-expanded=true`. Coordinator follow-on: the shadcn Button's `aria-expanded:bg-muted` would paint a light chip on
the media header while the menu is open — overridden to the overlay look.

Orphan note: stopping `next start` through the background task killed only the pnpm wrapper; its node child kept port
3200 and a handle on `public/r` (a `registry:build` EPERM, then an EADDRINUSE). Stop the server by the PID listening on
the port.

### U5 — installs (`E:/tmp/ilinxa-release-kit/installs-r9.sh`, `pnpm test:install` on the local `public/r`)

| Run | Items | CLI | Result |
|---|---|---|---|
| A / B (first) | — | — | timed out in the consumer's own `pnpm install` (600 s, host load) before any add — re-run |
| A2 | story-viewer, story-viewer-fixtures | 4.18.0 | pass — 41 files incl. `lib/preload.ts` + `parts/ambient-backdrop.tsx`, `dummy-data.ts`, stamp `0.7.0`, consumer `tsc` 0 |
| B2 | story-viewer-fixtures alone (brings the base; the 0.5.3 F-01 workaround) | 3.8.5 | pass — 41 files, stamp `0.7.0`, consumer `tsc` 0 |
| C | story-viewer alone (negative path) | 4.18.0 | pass — 40 files, no `dummy-data.ts`, consumer `tsc` 0 |

Each consumer also gets comment-thread, engagement-bar, expandable-text and video-player through `registryDependencies`.

## U6 — Docs & review

Doc verifier (fresh Sonnet, read-only): no false statement; 7 imprecise ones — all corrected (cursor re-seed also on an
`initialStoryIndex` change while open; the PREVIOUS author's cube face shows nothing for an aged-out answer; usage
`invalidateMedia(itemId?, storyId?)` + own-`src` items unaffected; "never for an unavailable item"; the removal notice
"no longer loses the time the media notice spent paused" (not "its full time"); reduced motion swipe is a hard cut
too). Review file: [`reviews/2026-10-29-v0.7.0-host-contract.md`](reviews/2026-10-29-v0.7.0-host-contract.md) — Pass with
follow-ups (FU-9 … FU-13). Reply: `.claude/report-back-2026-10-29-release-9.md`.

## U3 — final battery (2026-10-29, after every U4 / U5 / U6 change)

tsc 0 · lint 0 errors / 11 warnings (baseline) · meta-deps 0 · whitelist / registry-json / naming / control-chars /
barrel `--strict` / inert `--strict` 0 · doc-drift 0 · doc-budget 0 · `registry:build` 0 (story-viewer 378.6 / 390 KB)
· `pnpm build` 0 · tests 233 files / 3 243 passed, 0 failed (`--maxWorkers=3`; the default pool lost 30 files to worker
start-up timeouts, 0 failures among the rest).

## U7 — Ship

GATE 3: Pass with follow-ups (review file above). Commit + push under the user's "close it end to end"; live poll below.

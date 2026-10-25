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
| **Current stage** | U1 — **awaiting sign-off** (Part 3 proposal) |
| **Sign-off policy** | user-interactive. Ask before every push. |
| **Version target** | v0.5.3 → **v0.6.0** (option: the bug fixes first as 0.5.4) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.7 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1256-1433`) as amended by the digest §Part 3 "story-viewer".

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — sign-off: pending
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

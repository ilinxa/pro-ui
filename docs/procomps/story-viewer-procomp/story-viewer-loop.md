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

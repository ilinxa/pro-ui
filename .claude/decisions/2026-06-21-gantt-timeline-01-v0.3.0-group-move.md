---
date: 2026-06-21
session: gantt-timeline-01 v0.3.0 group-move
phase: procomp v0.3.0 (minor, public-API-touching, narrow scope)
type: feature-minor
commits: [7d67a31]   # feat; docs-lock commit follows
components: [gantt-timeline-01]
findings: [F-01-live-walkthrough-OWED, F-02-bracket-only-preview, F-03-canGroupMove-per-render, F-04-snap-frozen-at-drag-start]
status: shipped-pushed
---

# gantt-timeline-01 v0.3.0 — group-move (drag a summary bracket → rigid subtree shift)

The feature the user **intuited** in the v0.2.1 "the bracket doesn't track" investigation — which closed as **correct WBS semantics, not a defect**. The missing capability was moving the **group as a rigid unit**, not one child at a time. v0.3.0 is that: drag a WBS summary bracket → every descendant leaf shifts by one snapped delta.

## Three gates

- **GATE 1 (description):** [`-description-v0.3.0.md`](../../docs/procomps/gantt-timeline-01-procomp/gantt-timeline-01-procomp-description-v0.3.0.md). Two calls locked **with the user**: **D22 auto-when-movable** (no new prop; bracket-drag shifts when `editable` + movable, else falls back to v0.2.1 pan) · **D23 atomic permission** (summary + every descendant leaf must pass `can("move")`; one locked leaf vetoes the group). Two self-review consistency passes fixed 3 description drifts (bump-line handle overclaim, the honest pan→move behavior-change note, the thin-bracket hit-target).
- **GATE 2 (plan):** [`-plan-v0.3.0.md`](../../docs/procomps/gantt-timeline-01-procomp/gantt-timeline-01-procomp-plan-v0.3.0.md). File-by-file "how." A second consistency pass fixed 3 plan drifts vs source (`./geometry` import path not `../lib/geometry`; `moveSubtree` deps; and the `subtreeLeaves(item)` signature after the perf refactor). Q2 = **include** `shiftTaskGroup` handle method.
- **GATE 3 (review):** [`2026-06-21-v0.3.0-spotcheck.md`](../../docs/procomps/gantt-timeline-01-procomp/reviews/2026-06-21-v0.3.0-spotcheck.md). Rotating dim **Public API**. **Pass with follow-ups.**

## What shipped (additive — zero rewrite)

- **`lib/edit-mutations.ts`** — `shiftSubtree(data, rootId, deltaMs)` (rigid per-leaf shift; span invariant ⇒ no MIN_DURATION clamp) + `subtreeLeaves(root)` (walks the item directly — no index rebuild). Both pure, Vitest-ready.
- **`hooks/use-gantt-edit.ts`** — `canGroupMove(item)` (atomic gate; render-hot, index-free) + `moveSubtree(id, deltaMs)` (chokepoint: `guard` summary → atomic leaf check → `shiftSubtree` → per-leaf `onFieldEdited`/`onTaskReschedule` → one `onChange`). **No internal data state** (controlled-echo; undo/redo stays consumer-owned).
- **`parts/gantt-timeline-body.tsx`** — one new `groupmove` `EditDrag` arm: hit-test `[data-summaryid]` **before** the v0.2.1 pan fall-through; `moveEdit` snaps the leading edge; `commitEdit` early-returns to `moveSubtree`; `EditPreview` renders the shifted bracket ghost.
- **`parts/gantt-bars.tsx`** — `SummaryBar` gains `groupMovable` (grab cursor + transparent vertical hit-pad; visual unchanged).
- **`types.ts`** — `GanttContextValue` +`canGroupMove`/`moveSubtree`; `GanttTimelineHandle` +`shiftTaskGroup`. **`root.tsx`** wires them. **`meta.ts`** v0.3.0 + bullet. **`registry.json`** description (no file-list change — all touches to existing files). Guide / usage / demo hint updated.

**No new files · no new deps · no new shadcn primitive.** So the F-cross-13 smoke trigger (new primitive) does **not** fire.

## Reusable lessons

1. **A "the X doesn't track" perception can be correct semantics AND a feature signal.** v0.2.1 proved the bracket was right (WBS min→max); v0.3.0 is the real feature the user's intuition pointed at. Investigate-then-explain-with-a-repro first; the missing capability often hides behind the "bug."
2. **Reuse the existing permission verb instead of inventing one.** Group-move is "move applied to each leaf," so it maps onto the existing `drag` rule + `onFieldEdited`/`onChange` — atomic gate = `can("move")` over every leaf. No new `GanttEditAction`, no new event. (Same "adopt, don't invent" as v0.2.0.)
3. **A capability used in the render path must be index-free.** `canGroupMove` runs per visible summary per render; the first cut rebuilt the whole-forest index per call (`subtreeLeaves(data, rootId)`). Since the caller already holds the item, walking `item.children` directly (O(subtree), with `can()`'s own memoized index for the O(1) level lookup) is the right shape. Caught in self-review, refactored pre-ship, plan synced.
4. **A new gesture is safe only if the old path is a guaranteed fall-through.** The `[data-summaryid]` arm returns `false` (→ v1 pan) whenever `!editable`, the group isn't movable, or it's the empty row area — so every non-group-move case is byte-identical to v0.2.1. Backward-compat is structural.

## Findings / RESUME

- **F-01 (Medium) — live drag-walkthrough OWED.** tsc/lint/build/artifact all green and the gesture is verified by code-path reasoning, but the browser drag-walkthrough (the project's de-facto gate) was not run in this environment. **RESUME = run it post-deploy** (drag a movable bracket; lock a leaf → confirm it pans; collapsed-summary shift). Low risk (read-only + non-movable paths provably unchanged) but owed.
- **F-02 (Low)** richer per-leaf ghost preview → v0.3.x. **F-03 (Low)** memoize `canGroupMove` if profiling shows cost → v0.3.x. **F-04 (Low)** snap/Alt frozen at drag-start (parity with single-move) → won't-fix.
- **Next features (v0.3.x):** resize-the-group (proportional subtree rescale via bracket-edge drag) · `groupMoveMode: "atomic" | "partial"`. The other named procomp **`calendar-01`** remains unstarted (fresh GATE 1).

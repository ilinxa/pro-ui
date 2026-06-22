---
date: 2026-06-22
session: gantt-timeline-01 v0.3.1 external-review hardening
phase: procomp v0.3.1 (patch — non-breaking; skips GATE 3 per readiness rule)
type: bugfix-hardening
commits: [8235917]
components: [gantt-timeline-01]
findings: [G1-keyboard-scroll-High, G2-finite-guards-Med, G3-calendar-snap-Med, G4-phantom-expireAt, G5-stale-wheel-tooltip, G6-add-below-gating, G7-renamingId-on-delete, G8-resizeobserver-loop, G9-positional-aria, G10-deleted-edit-bail, F-01-live-walkthrough-OWED]
status: shipped-pushed
---

# gantt-timeline-01 v0.3.1 — external-review hardening

An external **read-only** review of v0.3.0 (`e:/tmp/ilinxa-ui-pro-gantt-timeline-01-report.md`) filed 10 generic findings (correctness / a11y / robustness / consistency). I re-validated **every one against source** before touching code: **all 10 are real.** Two explanation-level caveats were recorded (the findings still hold; only the report's *reasoning* was off):

- **G2** — the report says a NaN child "NaNs the whole parent bracket via `summarySpan`." It does **not**: `NaN < Infinity` / `NaN > -Infinity` are both `false`, so a bad child is silently *skipped* (same effect as the explicit guard in `dataExtent`). The real symptoms (origin-pinned leaf bar + `new Date(NaN).toISOString()` throw on edit-commit) are valid; the propagation mechanism claimed is not.
- **G10** — valid but **near-theoretical**: `gantt-edit-popover` returns `null` (self-unmounts) the moment `getItem(id)` is undefined, so hitting the silent-drop requires a same-tick race. Fixed defensively anyway.

The report's own headline — the entire `editable` gesture surface has **never been run in a live browser** (matches our own v0.3.0 **F-01**) — is correct and remains the biggest open risk. Static review found these 10; the gestures themselves are still unproven.

All fixes are **non-breaking** (behavior corrections + additive ARIA + two additive `GanttRow` fields on a returned type). Per [`readiness-review.md`](../rules/readiness-review.md) a patch bump does **not** trigger GATE 3.

## The fixes

| # | Sev | Fix | Files |
|---|-----|-----|-------|
| **G1** | **High** | Keyboard tree could not scroll past the virtualized window. Vertical scroll is one-way (body→gutter `translateY`) and the gutter is `overflow-hidden` + virtualized, so ArrowDown/End past the visible rows focused a row not in the DOM → `focus()` no-op → silent dead-end. On `focusedId` change, scroll the body to bring `index * rowHeight` into view, then focus across ≤3 rAFs while the virtualizer re-renders. | `parts/gantt-timeline-gutter.tsx` |
| **G9** | a11y | `aria-setsize` / `aria-posinset` added per tree level (two new `GanttRow` fields emitted by `flatten`). Flat virtualized-tree pattern — `role="group"` containers are impractical with absolute-positioned virtual rows and not required when level/setsize/posinset are present. | `types.ts`, `lib/flatten.ts`, `parts/gantt-timeline-gutter.tsx` |
| **G2** | Med | Finite-date guards. Body renders no bar (label-only row) when geometry is non-finite — kills both the NaN→origin bar **and** the edit-commit throw (no draggable shape to grab). `setWindow` skips re-serializing a non-finite `expireAt`; `shiftSubtree` leaves a bad-date leaf untouched; the keyboard-arrow reschedule no-ops on a non-finite date (Delete/Enter still work so you can fix/remove it). | `lib/geometry.ts` (read), `lib/edit-mutations.ts`, `parts/gantt-timeline-body.tsx` |
| **G3** | Med | Drag-snap for month/quarter/week now lands on real calendar boundaries via `startOfUnit`/`addUnit` (the same the axis ticks use) instead of average-ms rounding that drifted off-grid when zoomed out. New `snapCalUnit` + `snapPos` helpers; numeric/`off`/Alt snapping unchanged. | `parts/gantt-timeline-body.tsx` |
| **G4** | Low | Phantom `onFieldEdited("expireAt")` on a start-edge resize of an `expireAt`-driven bar (raw-string compare against `setWindow`'s re-serialized canonical form). Now each field event is gated on the patch actually touching that key **and** compares by `Date.parse` instant. | `hooks/use-gantt-edit.ts` |
| **G5** | Low | Stale hover tooltip after a wheel pan/zoom — the wheel handler moved the bars but never cleared `hover` (pointer-drag already did). Clear `hover` in both wheel branches. | `parts/gantt-timeline-body.tsx` |
| **G6** | Low | "Add task below" was shown on the item's own `addChildren` rule but enforced on the **parent's** (it inserts a sibling) → showed-then-no-op + spurious `onPermissionDenied`. Now gated on the parent's create rule (root items: `editable` only, matching `createItem`'s root-insert path). | `parts/gantt-context-menu.tsx` |
| **G7** | Low | `deleteItem` cleared `editingId` but left `renamingId` dangling. Clear both. | `hooks/use-gantt-edit.ts` |
| **G8** | Low | `ResizeObserver` observed the same scroll element it resizes → scrollbar-appearance shrinks `clientWidth` → relayout → re-fire ("ResizeObserver loop" warning). rAF-coalesce the `setBodyWidth` callback. | `parts/gantt-timeline-body.tsx` |
| **G10** | Low | `applyEditedSubtree` echoed an **unchanged** forest (silent edit loss) if the edited id was gone. Now bails + closes the editor when `index.get(id)` is undefined. | `hooks/use-gantt-edit.ts` |

## Notable implementation detail

The G1 body-scroll write tripped the React Compiler's `react-hooks/immutability` rule (`el.scrollTop = …` where `el` is read inline off the context object — the compiler reads it as mutating a memoized hook value). The codebase's proven fix (already used in `gantt-timeline-body.tsx`) is to **alias the bundled ref object to a local `const` first** so the compiler tracks it as a `RefObject` and treats `.current.scrollTop` as a legal ref mutation. Reading `ctx.bodyScrollRef.current` inline does not get that treatment. Applied the alias; folder lint went to 0 errors.

## Gates

- tsc 0 · gantt-folder lint **0 errors** (1 pre-existing `incompatible-library` warning on `useVirtualizer`, part of the 81/22 baseline) · `validate:meta-deps` **56/56 clean** · `pnpm build` ✓ (65/65 static pages) · `registry:build` ✓ (only `public/r/gantt-timeline-01.json` changed; `meta.ts` correctly absent from the artifact).
- No new files, no new deps, no new shadcn primitive. `meta.ts` → `0.3.1`, `updatedAt: 2026-06-22`.

## Open / carried

- **F-01 (Medium, carried from v0.3.0):** live drag-walkthrough OWED post-deploy. This patch is verified by code-reasoning + green gates only; the gesture surface (drag-move / edge-resize / draw-create / @dnd-kit reparent / group-move) is the part static review can't cover — it needs a browser pass. The visual walkthrough is the project's de-facto gate.
- **Shipped + pushed** to `master` (`8235917`, `495fb71..8235917`) — Vercel auto-deploys. Optional next: F-cross-11 cross-backend consumer-tsc smoke (no new primitive this bump, so the F-cross-13 risk is unchanged from v0.3.0).

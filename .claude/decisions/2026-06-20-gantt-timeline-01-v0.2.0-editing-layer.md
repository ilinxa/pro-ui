---
date: 2026-06-20
session: gantt-timeline-01 v0.2.0 editing layer ("Phase 2")
phase: procomp v0.2.0 (minor, public-API-touching)
type: feature-minor
commits: [db2e2d5]   # pushed to master 2026-06-20 (ff over 64fddd8)
components: [gantt-timeline-01]
findings: [F-01-postdeploy-smoke-CLEAN, F-02-reorder-offbyone-FIXED, F-03-virt-suspend-drag, F-04-drawcreate-gate]
status: shipped-pushed-smoke-clean
---

# gantt-timeline-01 v0.2.0 — the editable Gantt ("Phase 2")

The user's "Phase 2" = make v1's read-only Gantt **editable**. v1 was architected for exactly this (D3 drag seam: controlled data + typed-but-dormant `onTaskReschedule`), so v0.2.0 is **purely additive — zero rewrite**, gated behind `editable` (default off = byte-identical v1).

## Three gates

- **GATE 1 (description):** `gantt-timeline-01-procomp-description-v0.2.0.md`. User confirmed scope + the 4 recommendation calls: **D14 controlled-only · D19 consumer-owned undo · D20 summary non-manipulable · D21 marquee→v2.1**. Scope expanded past the v1 doc's original "v2" sketch (added delete / rename / reparent / detail-edit) per the user's "make it complete."
- **GATE 2 (plan):** `gantt-timeline-01-procomp-plan-v0.2.0.md`. User confirmed the dep cost and **kept the right-click context-menu in v2** (I had proposed deferring it). Implementation refinement during build: the detail editor uses a **custom overlay, not the `popover` primitive** (sidesteps F-cross-13 the way v1's tooltip did) → new shadcn surface dropped from 3 to **2** (`input` + `context-menu`).
- **GATE 3 (review):** spotcheck, rotating dim **Robustness**. **Pass with follow-ups.** ([review](../../docs/procomps/gantt-timeline-01-procomp/reviews/2026-06-20-v0.2.0-spotcheck.md))

## What shipped

**The validation win:** the entire edit vocabulary already existed as shared types in `todo-rich-card` — `TodoPermissions`/`TodoPermissionRule` (the matrix `todo-tree` already reuses via `evalPermission`) + the event shapes (`TodoItemAddedEvent`/`…Removed`/`…Moved`/`TodoFieldEditedEvent`/`TodoStatusChangedEvent`). So v2 **adopts** the vocabulary the card + tree already speak (imported via the rewriter-safe barrel `../todo-rich-card`); the gantt is the **3rd consumer**. Zero new event/permission types invented.

- **New pure libs:** `lib/edit-mutations.ts` (forest add/remove/move/rename/setWindow + buildIndex + isAncestor; structural-sharing, Vitest-ready) + `lib/edit-permissions.ts` (`evalGanttPermission`, mirrors todo-tree).
- **New hook:** `hooks/use-gantt-edit.ts` — transient edit-UI targets + mutation dispatchers (single chokepoint: veto-before-dispatch → compute next forest → fire event + `onChange`; **no internal data copy**).
- **New parts:** `gantt-context-menu.tsx` (Radix `context-menu`, permission-gated) + `gantt-edit-popover.tsx` (custom overlay hosting the lazy editable card).
- **Edited:** `types.ts` (edit props + context + handle), `gantt-bars.tsx` (resize handles + grab cursors + `data-edge`), `gantt-timeline-body.tsx` (edit hit-test BEFORE pan: resize→move→draw-create→pan; preview ghost; keyboard editing), `gantt-timeline-gutter.tsx` (@dnd-kit three-zone reparent + inline rename + ＋/🗑 affordances + context-menu), `gantt-timeline-root.tsx` (wire `use-gantt-edit` + mount editor), assembly/index/demo/usage/meta/registry.json.
- **24-file base.** New deps: shadcn `context-menu` + `input`; npm `@dnd-kit/core` (already a consumer peer via todo-tree/kanban).

## Gates green

tsc 0 · scoped ESLint **0 err** (1 known virtualizer warn) · validate:meta-deps **56/56** · `pnpm build` ✓ (65/65 pages, no SSR err) · `registry:build` ✓. F-02 (sibling-reorder off-by-one) found + **fixed pre-ship**.

## Reusable lessons

1. **A "v2" can be almost pure adoption when siblings already speak the vocabulary.** Validating `todo-rich-card`'s exports first revealed the whole permission + event surface was already shared — so the editing layer imported it rather than inventing types. Always grep the sibling's `index.ts`/`types.ts` before designing a new event/permission surface.
2. **Gesture arbitration is the v2 risk — make the read-only path a guaranteed fall-through.** The body's `pointerdown` runs an explicit hit-test (resize edge → bar body → empty row → v1 pan) that returns to the v1 pan path whenever `!editable` or permission denies. `button === 2` (right-click) is excluded from the pointer gesture entirely. Backward-compat is structural, not incidental.
3. **Controlled-only data makes undo/redo the consumer's for free** — `onChange(forest)` + a history stack (demonstrated in the demo). No internal document = nothing to desync with sibling List/Board tabs. The opposite call (uncontrolled + built-in history, media-editor style) is only worth it when the component owns the document.
4. **Custom overlay > primitive for an embedded editor** — the detail editor uses a plain backdrop+panel, not `popover`, reducing the new-primitive (F-cross-13) surface. Same move v1 made for the tooltip. Reach for the primitive only when you need its focus-trap/positioning behavior.
5. **@dnd-kit three-zone droppables** (`before:`/`into:`/`after:` per row) give tree reparent without manual rect math — `over.id` names the zone. Mirror todo-tree's edge model. Always render the DndContext (draggables self-disable) so per-row `useDraggable` always has a provider.

## Shipped + F-01 smoke CLEAN (2026-06-20)

Committed `db2e2d5` → ff-merged to `master` → pushed (`64fddd8..db2e2d5`). Vercel redeployed; v0.2.0 artifact live (markers: `@dnd-kit/core`, `context-menu`, `use-gantt-edit`, `edit-mutations`). **F-01 ran CLEAN** in the base-nova/**Base UI** consumer: `shadcn add @ilinxa/gantt-timeline-01 --overwrite` installed all 5 new files + the 2 new primitives; consumer `tsc --noEmit` had **0 gantt / todo-rich-card errors** (rest is pre-existing unrelated noise). **The `context-menu` `asChild` — the F-cross-13 watch item — compiled clean cross-backend: no regression on first ship.** (Runtime asChild behavior on Base UI isn't covered by tsc; the historical F-cross-13 failures were type-level, which this clears.)

## Open / RESUME

**Shipped + pushed + smoke CLEAN.** Nothing pending. Open follow-ups all Low: **F-03** (suspend virtualization during a gutter drag) · **F-04** (gate draw-create at start) · **v0.2.1** (marquee/multi-select + bulk; calendar-aware snap). Carried v0.1.0: chart `height` prop, context-split perf, Vitest (the new pure `edit-mutations`/`edit-permissions` are test-ready). The other named procomp, **`calendar-01`**, remains unstarted (fresh GATE 1).

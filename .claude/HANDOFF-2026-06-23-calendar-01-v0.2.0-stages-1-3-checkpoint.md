# HANDOFF — `calendar-01` v0.2.0 editing layer — Stages 1–3 checkpoint (2026-06-23)

> **⛔ SUPERSEDED — v0.2.0 is now SHIPPED + PUSHED (tip `c8b686d`).** This is the pre-ship checkpoint record (historical). For the current state + resume plan see [`HANDOFF-2026-06-23-calendar-01-v0.2.0-shipped.md`](HANDOFF-2026-06-23-calendar-01-v0.2.0-shipped.md). SHAs below (`cd75819`) are pre-reconcile.
>
> **Status (at the time):** committed WIP checkpoint, **NOT shipped**. Stages 1–3 of 4 built + gates green + self-reviewed (Pass w/ follow-ups, 0 blockers). **Resume = Stage 4 → ship.**

## TL;DR for the next session

The calendar is now a working **editor** (opt-in via `editable`). Month + week/day + agenda all support drag/resize/create/delete + a quick-create popup + right-click menu + a details/inspector panel. Event **color now reflects status** (was time-urgency) and **high-priority events show a flag**. It compiles, lints, builds, and was adversarially reviewed. What's left is **Stage 4** (keyboard, cross-view DnD, responsive overflow) and then the **ship steps** (meta/registry bump, guide, GATE 3 spotcheck, cross-backend smoke).

## What was built (Stages 1–3)

**Foundation (pure, framework-free):**
- `lib/edit-mutations.ts` — mirror of gantt's, **minus group-move**, **plus** all-day-aware `setWindow` + `formatDateValue` (inverse of `classify.ts`'s `parseDateValue`; writes bare `YYYY-MM-DD` from LOCAL fields for all-day → **no UTC off-by-one**, verified by a node round-trip even in UTC+3) + `snapStepMs`/`snapToStep`.
- `lib/edit-permissions.ts` — `evalCalendarPermission` (near-copy of `evalGanttPermission`; calendar = 4th `TodoPermissions` consumer after card/tree/gantt).
- `hooks/use-calendar-edit.ts` — the dispatch chokepoint (guard → mutate → typed event → `onChange`; **no internal data state**; every dispatcher no-ops when `!editable`). Holds transient edit UI state: `editingId`/`renamingId`/`composerTarget`/`resizePreview`.

**Wiring:** `parts/calendar-root.tsx` constructs the edit hook, mounts the single `DndContext` (only when `editable`), threads `select` into the hook (new-event auto-select), and exposes everything via context. Live handle methods (`addTask`/`deleteTask`/`editTask`/`beginRename`/`openQuickComposer`).

**Views / parts:**
- Month: `parts/calendar-month-view.tsx` — @dnd-kit drag-move (whole-day, DST-safe via `addDays`) + native day-resize (drop `seg.spanning` so single-day all-day bars resize too) + **double-click** create + droppable cells.
- Week/Day: `parts/calendar-time-grid.tsx` — native-pointer move/resize/draw (continuous geometry; the plan §3 "split-by-surface-geometry" refinement) + **F-03 all-day spanning band** (reuses generalized `lib/segments.ts` `layoutMonthWeek`, now N-column) + double-click create.
- Agenda: `parts/calendar-agenda-view.tsx` — right-click context menu + flag (fixed in self-review F-03).
- Shared: `parts/calendar-edit-affordances.tsx` — `DraggableEventWrap` + `DayResizeGrip` (used by month + band; de-duped).
- `parts/calendar-context-menu.tsx` — `CalendarEventContextMenu` (mirror of gantt's; `ContextMenuTrigger asChild` cross-backend-safe shape). **Required the event primitives to spread `...rest`** (else `onContextMenu` never reaches the button — that was the "right-click does nothing" bug).
- `parts/calendar-quick-composer.tsx` — `CalendarQuickComposer`, a **plain fixed-position panel** (deliberately NOT a Radix Popover → dodges the Base-UI `PopoverAnchor`/`asChild` divergence). `window`-guarded for SSR. Mounted by the assembly.
- `parts/calendar-event-inspector.tsx` — `CalendarEventInspector` (`showInspector` side panel; preview + Edit→lazy `<TodoRichCard editable>` + Delete).
- `parts/calendar-event.tsx` — the 3 primitives now spread `...rest` + render the priority `Flag` from `occ.flagColor`.

**Two user-directed visual changes (post-GATE-2; recorded in plan §14b):**
- **(A) Status-driven color** — `lib/color.ts` `eventColor` reworked: `borderColor` → `statusColors[status]` → tone(done/blocked) → `colorBy==="urgency"`?ramp:`--primary`. New props `statusColors`, `colorBy` (default `"status"`). ⚠️ **The one place editable=false is NOT byte-identical to v1** (active events recolor from urgency-ramp). Intentional; `colorBy="urgency"` restores v1.
- **(B) High-priority flag** — `flagPriority?: (item)=>boolean` → `flagColor` on the occurrence (= `priorityOptions` color, fallback `--destructive`) → solid `Flag` icon on every event surface.

**Demo** (`demo.tsx`) gained an "Editable" tab + `STATUS_COLORS` + `flagPriority` across all tabs; `dummy-data.ts` got `priority: "high"` on 3 items.

## Files (working tree, all calendar-01 + the 2 v0.2.0 docs)
12 modified + 9 new under `src/registry/components/data/calendar-01/`; 2 new docs under `docs/procomps/calendar-01-procomp/` (`description-v0.2.0.md`, `plan-v0.2.0.md`).

## Gates (2026-06-23)
**tsc 0 · eslint 0 (calendar folder) · validate:meta-deps 57/57 · pnpm build 66/66 pages (no SSR err).** Live in-browser walkthrough NOT run (headless env — no X server; user verified interactively on `:3001` during the build).

## Self-review (2026-06-23) — Pass with follow-ups, 0 blockers
Fixed in-review: **F-02** (all-day band created on single-click → now double-click + composer), **F-03** (agenda had no context menu → added + flag), **F-08** (new public types added to barrel).
**Carried follow-ups** (also in plan §14b):
- F-04 (Med) — live `resizePreview` is in the context `useMemo`, so every pointermove during a resize rebuilds the whole context value → all consumers re-render each frame. Works, but isolate to a preview-only context for perf.
- F-05 (Low) — `onExternalDrop` + `getItem` are in the context but unread (external DnD is Stage 4). Inert-by-design; don't mistake for done.
- F-06 (Low) — `moveItemAction`/`onItemMoved` reserved (reparent path), unreachable by design.
- F-07 (Low) — `changeStatus`/`changePriority`/`applyEditedSubtree` re-implement tree-replace; could reuse an exported `replace()`.
- F-09 (Low) — `onTaskReschedule` fires whenever `next!==data` even if the instant didn't change (the two `onFieldEdited` are correctly instant-gated).
- F-10 (Low) — **meta.ts (still 0.1.0, no edit deps) + registry.json (no new files) MUST be updated at ship**, or the cross-backend smoke tests an incomplete artifact.
- F-11 (Low) — composer/inspector don't restore focus on close; align with Stage 4 keyboard.

## RESUME — Stage 4 (the remaining plan checkpoint 4)
1. **Keyboard editing** — selected event: arrows move (day in month, snap-step in time grid), Shift+arrow resize, Delete/Backspace delete, Enter open detail, F2 rename; empty-cell Enter → composer. Scope to event/cell focus; don't collide with v1's M/W/D/A + ←/→ period keys (in `calendar-root.tsx` `handleKeyDown`).
2. **Cross-view + external DnD** — wire `onExternalDrop` (native HTML5 `onDragOver`/`onDrop` on month cells + band cells + time slots) and make the agenda rows @dnd-kit drag sources so agenda→month/grid drops reschedule. (Month/band droppables already exist; time-grid needs @dnd-kit droppables added alongside its native move layer.)
3. **F-04** — height-responsive month "+N more" cap (measure cell height ÷ row height; `maxEventsPerCell` still overrides). Type already declares `default = height-responsive`.

## THEN — ship steps (plan §14 tail)
meta.ts → 0.2.0 + features + add deps (`context-menu`, `input`, `@dnd-kit/core`) · registry.json → add the 7 new files + bump · author `calendar-01-procomp-guide.md` v0.2 · `pnpm registry:build` · GATE 3 spotcheck (`docs/procomps/calendar-01-procomp/reviews/<date>-v0.2.0-spotcheck.md`) · cross-backend consumer-tsc smoke (the new primitives re-arm F-cross-13) · ship.

## ⚠️ Git situation (resolve before any push)
Branch **DIVERGED** from origin during the session:
- **local `master`:** `…425a952 → 7ba0dd6 (cal v0.1.0 feat) → 76c11f0 (cal v0.1.0 docs) → d981f27 (gantt v0.4.0) → [this checkpoint]`
- **origin/master:** `…425a952 → 84ef1ea (gantt v0.4.0)` — does NOT contain the calendar v0.1.0 commits.

The gantt v0.4.0 work was committed twice (local `d981f27` ≠ pushed `84ef1ea`, same message). The user must reconcile (likely: rebase the calendar commits onto origin's `84ef1ea`, dropping the duplicate local `d981f27`). **This checkpoint commits on local `master`; do NOT push until the divergence is resolved AND v0.2.0 is actually shipped (Stage 4 + ship steps done).**

## Key lessons (this build)
- **Right-click "does nothing"** = Tier-C event primitives must spread `...rest` so `ContextMenuTrigger asChild`'s `onContextMenu` reaches the DOM button (Radix Slot merges props onto the child element; a component that ignores extra props drops them).
- **Resize "not working"** = an invisible hover affordance (the delete-✕, z-20) was layered over the resize grip (z-10) on short bars; grabbing the edge hit the ✕. Don't stack interactive affordances on a 20px bar — delete moved to panel + context menu.
- **Live preview** = a shared transient `resizePreview` in context + renderers substituting the previewed occ's start/end before geometry/layout; commit on release. Cheap to write, but it re-renders the whole context (F-04).
- **Quick composer** = a plain fixed panel beats a Radix Popover here (no `PopoverAnchor` Base-UI trap; arbitrary pointer-anchoring is trivial).
- **All-day ⇄ timed** = `formatDateValue(ms, allDay)` (LOCAL Y/M/D for all-day) is the inverse of the floating-local `parseDateValue`; round-trips with no off-by-one even at UTC+3.
- **Status color** = the user's mental model was "color = status," not "color = deadline urgency." The v1 urgency default surprised them. Default flipped to status; urgency kept as `colorBy="urgency"`.

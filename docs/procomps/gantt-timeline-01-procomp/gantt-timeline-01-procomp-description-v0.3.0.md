# `gantt-timeline-01` v0.3.0 — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** 🟡 Awaiting sign-off (**GATE 1**) — two calls already locked with the user: **D22 auto-when-movable** · **D23 atomic permission**. The rest (D24–D26) are GATE 2 "how" details.
> **Slug:** `gantt-timeline-01` · **Category:** `data` · **Tier:** pro-component (shadcn-style compound)
> **Bump:** v0.2.1 → **v0.3.0** (minor; new editable capability. Public-surface touch is small + additive: an additive prop on the `SummaryBar` Tier-C primitive (`groupMovable`) and — pending Q2 — one optional `GanttTimelineHandle` method. The rest is internal context API. **No new files, no new deps, no new shadcn primitive.** Opt-in behind `editable`).
> **Predecessors:** v0.2.0 [description](./gantt-timeline-01-procomp-description-v0.2.0.md) (D13–D21) + [plan](./gantt-timeline-01-procomp-plan-v0.2.0.md), and the v0.2.1 polish (bracket-drag → pan). This doc records ONLY the **group-move** delta; everything not restated is inherited from v0.2.x unchanged.

This is the **what & why** of **group-move**: drag a WBS **summary bracket** → shift the whole subtree by one time delta. It is the feature the user *intuited* in the v0.2.1 "the bracket doesn't track" investigation — which closed as **correct WBS semantics, not a defect** (the bracket = `min(child start) → max(child end)`; moving one child moved the edge it owned, not the pinned opposite edge). The takeaway was that the user's instinct pointed at a real missing capability: moving the **group as a rigid unit**, not one child at a time.

---

## 0. Premise — the v0.2.1 pan-on-bracket was the seam for this

v0.2.0 D20 made summaries **non-manipulable** ("their bar is derived from children"). v0.2.1 then routed a drag *on a summary bracket* to the **canvas-pan** path (it had been spawning a stray sibling task via draw-create). That pan fall-through is exactly the seam group-move slots into: the body's gesture ladder already isolates the summary-row case; v0.3.0 inserts **one new arm before that pan fall-through** — *if the group is movable, drag-the-bracket shifts the subtree; otherwise it still pans.*

**Backward-compatibility is preserved structurally, not incidentally:**
- Default surface is unchanged — group-move is live **only when `editable`** (the v1 read-only path is byte-identical, untouched).
- When `editable` but the group is **not** movable (summary locked, or any descendant leaf locked/denied — see D23), bracket-drag **still pans** exactly as v0.2.1. The pan path is the guaranteed fall-through.
- No prop is added (D22). No new event type, no new permission type, no new file, no new dependency.

---

## 1. In scope / Out of scope (v0.3.0)

### In scope — group-move

- **Drag a summary bracket → rigid subtree shift.** Grab anywhere on the summary bar/bracket and drag horizontally; the **entire subtree** (every descendant) translates by the same snapped time delta. The bracket itself is derived, so it visibly re-frames its moved children as you drag.
- **Snap + free-drag** — same model as single-bar move: snaps the leading edge to the active minor unit; **Alt** = free-drag. (D18 inherited.)
- **Live preview** — a ghost of the shifted bracket span follows the drag with a delta/date label, matching the existing single-edit `EditPreview` affordance (D26).
- **Permission-gated (atomic)** — allowed only when the summary isn't locked **and every descendant leaf** passes `can("move")` (D23). One locked leaf blocks the whole group and the gesture falls back to pan; `onPermissionDenied` fires with the summary id.
- **Grab-cursor affordance** — the summary bar shows a `grab`/`grabbing` cursor only when the group is movable; otherwise the default cursor (it pans). *(Hit target: the bracket renders as a thin ~7px bar; GATE 2 will enlarge the pointer hit area (e.g. a transparent vertical pad on the `SummaryBar`) so the grab is comfortable without changing the visual.)*
- **Controlled echo** — group-move is a **bulk reschedule**: it fires the existing per-leaf field events for each shifted leaf, then a **single `onChange(next)`** carrying the whole mutated forest (D25). No new event type. Undo/redo stays consumer-owned (one `onChange` = one undo step). (D14/D19 inherited.)
- **Imperative parity (optional, GATE 2)** — a handle method `shiftTaskGroup(summaryId, deltaMs)` for programmatic/test parity with `addTask`/`deleteTask`/`editTask`. (Confirm at GATE 2; cheap and symmetric.)

### Out of scope (deferred / unchanged)
- **Vertical reparent by bracket-drag** — group-move is horizontal reschedule only; structural reparent stays the gutter @dnd-kit path (v0.2.0). No diagonal/auto-reparent.
- **Per-leaf partial move** — rejected at D23 (group never silently breaks apart). A future `groupMoveMode: "atomic" | "partial"` could revisit it; not now.
- **Resize-the-group** (stretch/compress the whole subtree by dragging a bracket *edge*) — distinct, harder (proportional rescale vs rigid shift); **v0.3.x/v0.4 candidate**, explicitly not in this ship.
- **Marquee / multi-select bulk move** — still v2.1 (D21 inherited). Group-move is structural (one subtree), not selection-based.
- Everything from v0.2.x (single-bar move/resize/CRUD/reparent/detail-edit/permissions) and all v1 read-only display/navigation — **unchanged**.

---

## 2. Data contract — no new fields, no new types

Group-move mutates **existing fields only** (`startAt`, and `expireAt` for expireAt-driven leaves) — it is single-bar move applied to each scheduled leaf. No new `TodoItem` field, no new event shape, no new permission key. It reuses the `drag` rule and `onFieldEdited`/`onTaskReschedule` events already shared from `todo-rich-card`. (Same "adopt, don't invent" discipline as v0.2.0.)

---

## 3. The two locked decisions (GATE 1)

**D22 — Activation: auto when movable (no new prop).** ✅ *locked with user.*
Dragging a summary bracket shifts the subtree whenever `editable` AND the group is movable; it falls back to v0.2.1 pan when the group is locked/denied. Rationale: it's the trajectory v0.2.1 set up ("summaries are read-only *today*"), it's the behavior the user intuited, and it's permission-gated so locked groups still pan. Keeps the public prop surface flat.
> **Honest behavior-change note:** an `editable` consumer **with a fully-movable group** *does* see bracket-drag change from **pan (v0.2.1) → group-move (v0.3.0)** — that is the feature, not a regression. It is acceptable because (a) it is gated behind `editable` (the read-only default is byte-identical), (b) v0.2.1's pan-on-bracket was explicitly an interim stopgap ("summaries are read-only *today*"), and (c) the pan behavior is exactly preserved for every non-movable group. *(Alternative — an opt-in `groupMove` prop that would preserve pan even for movable editable groups — was considered and declined; it adds prop surface and hides the feature, and the degrade-to-pan path already protects the locked/non-editable cases.)*

**D23 — Permission: atomic (all leaves movable).** ✅ *locked with user.*
Group-move is allowed only if the summary node isn't locked **and** every descendant **leaf** passes `can("move", leaf)`. A single locked/denied leaf blocks the whole group (rigid group, never breaks apart). On denial the gesture pans and `onPermissionDenied("drag", summaryId, reason)` fires. *(Alternatives — summary-level-only, which would drag locked leaves; and partial-move, which breaks the group apart — both declined.)*

---

## 4. GATE 2 "how" calls (sketched here, locked in the plan)

- **D24 — What shifts: scheduled leaves only (WBS-consistent).** Apply the single-move patch to each **leaf** descendant (`startAt = effStart + delta`; `expireAt = effEnd + delta` when expireAt-driven; `duration`/`setAt` untouched). Derived summaries (the dragged root + any nested summaries) **recompute** their brackets from the moved leaves; their own latent windows are **not** written — consistent with WBS (the gantt ignores a parent's own window) and avoids polluting data the gantt doesn't render. *(Plan will confirm; alternative = shift every node's own dates too.)*
- **D25 — Event shape: per-leaf field events + one `onChange`.** Fire `onFieldEdited(startAt[/expireAt])` (and `onTaskReschedule`) **per shifted leaf** — parity with single-move, so a consumer's existing field-edit handler sees each change — then a single `onChange(next)` for the whole forest = one undo step. No bulk event type invented. *(Plan will confirm the exact event set / any throttling.)*
- **D26 — Preview: shifted-bracket ghost.** Reuse `EditPreview` with a new `groupmove` arm rendering the shifted summary span + delta label. (Richer per-leaf ghost bars = a documented follow-up, not this ship.)

---

## 5. Why this is a clean, low-risk minor

- **Additive over an existing seam** — one new arm in `tryStartEdit`, one new pure mutation, one new dispatcher; the read-only and v0.2.x paths are untouched and remain the guaranteed fall-through.
- **No new vocabulary** — reuses the `drag` rule + existing events; the "adopt, don't invent" lesson from v0.2.0 holds.
- **No new files / deps / primitives** — so the F-cross-13 smoke trigger (new shadcn primitive) does **not** fire; a narrow public-API spot-check (GATE 3) is the right gate per [`.claude/rules/readiness-review.md`](../../../.claude/rules/readiness-review.md).
- **Pure mutation is Vitest-ready** — `shiftSubtree` joins `edit-mutations`'s test-ready surface.

---

## 6. Open questions for sign-off

1. **GATE 1 scope** as written (group-move = horizontal rigid subtree shift; resize-the-group and partial-move explicitly deferred) — confirm?
2. **`shiftTaskGroup` handle method** — include for imperative/test parity (recommended, cheap), or skip and keep the gesture-only?

On sign-off I'll author the v0.3.0 **plan** (GATE 2) — the exact mutation signature, the body gesture-ladder insertion point, the preview arm, the event set, and the file-by-file touch list — for a second sign-off before any code.

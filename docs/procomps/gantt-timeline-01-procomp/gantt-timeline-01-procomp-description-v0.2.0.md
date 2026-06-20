# `gantt-timeline-01` v0.2.0 — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** 🟢 Approved (**GATE 1**, 2026-06-20) — recommendations accepted: D14 controlled-only · D19 consumer-owned undo · D21 marquee→v2.1 · D20 summary non-manipulable → proceed to GATE 2
> **Slug:** `gantt-timeline-01` · **Category:** `data` · **Tier:** pro-component (shadcn-style compound)
> **Bump:** v0.1.0 → **v0.2.0** (minor; **public-API-touching** → full GATE 1 → 2 → 3 per [`.claude/rules/readiness-review.md`](../../../.claude/rules/readiness-review.md))
> **Predecessors:** v0.1.0 [description](./gantt-timeline-01-procomp-description.md) (D1–D12) + [plan](./gantt-timeline-01-procomp-plan.md) (the §6 "drag seam"). This doc records ONLY the deltas; everything not restated here is inherited from v0.1.0 unchanged.

This is the **what & why** of the **editing layer**. v0.1.0 shipped a read-only, fully-navigable Gantt whose state model was *deliberately architected for this* (v1 D3: controlled data + a typed-but-dormant `onTaskReschedule`). v0.2.0 makes it **editable** — direct bar manipulation, task CRUD, and detail editing — **additively, with zero rewrite of v1**.

---

## 0. Premise — additive editing over the v1 seam

The whole point of v1's D3 was that v2 drops in without an API/state rewrite. This holds, and it's now *over-delivered* by the ecosystem: **every edit event + the permission matrix v2 needs already exists as a shared type in [`todo-rich-card/types.ts`](../../../src/registry/components/data/todo-rich-card/types.ts)**, and [`todo-tree`](../../../src/registry/components/data/todo-tree/) already proved cross-procomp reuse of both (its `evalPermission` maps tree actions onto `todo-rich-card`'s `TodoPermissionRule`). So v2 doesn't invent an editing vocabulary — it **adopts the one the card + tree already speak**, importing it via the same rewriter-safe relative `../todo-rich-card`.

**Backward-compatibility is the hard constraint:** v0.2.0 must be a **no-behavior-change drop-in for existing v1 consumers**. Editing is **off by default** (`editable` defaults `false`); a consumer who doesn't opt in gets the exact v1 read-only Gantt. *(D13.)*

### Scope vs the v1 doc's original "v2" sketch

The v1 description §1 sketched v2 as *"drag-to-reschedule + edge-resize, marquee selection, in-place create."* This doc **expands** that — the user explicitly asked for *"create, delete, and whatever's needed to make it complete."* So v0.2.0 adds **delete, inline rename, gutter reparent/reorder, and detail-editing via the embedded card** on top of the original sketch, and **trims** marquee/bulk-select + built-in undo/redo out (see D19/D21 — both are clean, honest scope decisions, not omissions). v3 (dependency arrows) and v4 (progress/baselines/critical-path/swimlanes) are **unchanged**.

---

## 1. In scope / Out of scope (v0.2.0)

### In scope — the edit surfaces

**A. Direct bar manipulation**
- **Drag-to-reschedule** — drag a bar horizontally → shifts effective start **and** end together; snaps to the active minor unit (D18); modifier (Alt) = free-drag. Writes `startAt` (+ keeps the span: shifts `expireAt`, or recomputes from `duration`).
- **Edge-resize** — hover handles on a bar's left/right edge; left edge edits `startAt`, right edge edits `expireAt` (or `duration` when the item used `duration`, not `expireAt`). Clamp `end ≥ start` + a minimum visible width.
- **Milestone drag** — drag a diamond to move its single instant (writes `startAt`; stays a milestone).
- **Live drag affordance** — ghost/preview while dragging + a date tooltip following the cursor; grab / col-resize cursors. (Distinct from v1's canvas-pan grab cursor — bar-drag is hit-tested ahead of pan.)

**B. Task CRUD**
- **Create** — **two gestures** (D15): (a) **draw-on-canvas** — drag across an empty area of a row to set a new item's start→end; (b) a **gutter "＋" affordance** (add child of a row / add a sibling / add a root task). New item gets a fresh `id` (consumer may override in the handler).
- **Delete** — select + `Delete`/`Backspace`, a gutter row action, and a context-menu entry.
- **Inline rename** — double-click a gutter row's name → inline text field; `Enter` commits, `Esc` cancels.
- **Reparent + reorder** (D16) — drag rows in the **gutter** to change order and hierarchy, reusing the `todo-tree` DnD model (drop-as-sibling / drop-into-children, circular-drop ban).

**C. Detail editing (reuse, don't rebuild)**
- **Edit-in-card** (D17) — open the **already-lazy `<TodoRichCard editable>`** in a popover/sheet for `status` / `targetPerson` / `priority` / `labels` / `description` / color. The card emits its edited subtree; the gantt host splices it back into the forest. The gantt's `permissions` thread straight into the embedded card.
- **Quick status** — context-menu shortcut over `statusOptions` (sugar for the above).

**D. Edit infrastructure**
- **Per-item permissions** (D20) — adopt `todo-rich-card`'s `TodoPermissions` (`default`/`byLevel`/`byItem`/`inherit`) + per-action predicates (`canEditItem` / `canMoveItem` / `canResizeItem` / `canDeleteItem` / `canCreateChild`) + `onPermissionDenied`. `item.locked` blocks all edits (already in v1). A tiny gantt-side resolver maps gantt actions → `TodoPermissionRule` keys (`move`/`resize`→`drag`, `delete`→`remove`, `create`→`addChildren`, `editDetails`→`edit`), mirroring `todo-tree/lib/permissions.ts`.
- **Validation** — `end ≥ start`, min-width clamp, snap, permission + `locked` gates, all enforced **before** an event fires.
- **Keyboard editing** — on a selected bar: arrows + modifier nudge/resize by one snap unit; `Delete` deletes; `Enter` opens edit. (Composes with v1's arrows-=-gutter-tree-nav: bar-edit keys are active only when a **bar** holds focus, not a gutter row.)
- **Controlled echo** (D14) — data stays controlled (v1 D3). Every edit fires its typed event **and** an `onChange(next: TodoItem[])` carrying the whole mutated forest; the consumer echoes it back into `data`. No internal uncontrolled-data mode.

### Out of scope (deferred)
- **Marquee / multi-select + bulk move/delete** → **v2.1** (D21). v2 is single-item direct manipulation + CRUD; multi-select is a distinct surface.
- **Built-in undo/redo** → consumer-owned by virtue of controlled data (D19); recipe documented in the guide. Built-in history only makes sense if an uncontrolled mode is later added.
- **Dependency arrows / finish-to-start links** → **v3** (unchanged; no `dependsOn` field).
- **Progress % · baselines · critical path · resource swimlanes** → **v4** (unchanged).
- **Auto-scheduling / constraint solving / levelling** — non-goal (any version).

### Unchanged from v1
All read-only display + navigation (pan/swipe/zoom, momentum, focal-point zoom, two-tier axis, summary roll-up, milestone diamonds, today line, urgency ramp, virtualization, WAI-ARIA tree gutter, SSR-safe `now`), the compound structure, and portability rules carry over verbatim.

---

## 2. Data contract — no new fields

v0.2.0 introduces **no new `TodoItem` fields.** Edits mutate existing fields only: `startAt` / `expireAt` / `duration` (reschedule, resize, milestone-move), `name` (rename), `children` (create / delete / reparent), and—via the embedded card—`status` / `targetPerson` / `priority` / `labels` / `description` / `borderColor`. Hierarchy stays **nested `children`** (no `parentId`); CRUD events therefore carry `parentId` + `index` so the consumer can locate the splice point (same shape the card/tree already emit). The forest echo is `onChange(data: TodoItem[])` — the array analogue of the card's `onChange(tree: TodoItem)`.

---

## 3. API additions (sketch — NOT final; locked at GATE 2)

Everything below is **additive** to the v1 `GanttTimelineProps`. Edit affordances render only when `editable` is true AND the action's handler/permission allows (capability-gated, like `todo-rich-card`). **Event + permission types are imported from `../todo-rich-card`** — same vocabulary, zero new shapes.

```ts
import type {
  TodoItem, TodoPermissions, TodoPermissionRule,
  TodoItemAddedEvent, TodoItemRemovedEvent, TodoItemMovedEvent,
  TodoFieldEditedEvent, TodoStatusChangedEvent,
} from "../todo-rich-card";

// ── added to GanttTimelineProps (v1 surface unchanged) ──
type GanttEditProps = {
  /** Master switch. Default false → identical to v1 read-only. */
  editable?: boolean;

  /** Controlled-data echo: the full mutated forest after any edit. */
  onChange?: (data: TodoItem[]) => void;

  // Direct manipulation
  /** Bar move/resize sugar — KEPT from v1 (typed since v0.1.0). */
  onTaskReschedule?: (next: { itemId: string; startAt: string; expireAt?: string }) => void;
  /** Snap granularity for drags/resizes; default "minor" (the active axis unit). */
  snap?: "minor" | "hour" | "day" | "week" | "off" | number;

  // CRUD (event shapes reused from todo-rich-card)
  onItemAdded?:   (e: TodoItemAddedEvent) => void;     // create
  onItemRemoved?: (e: TodoItemRemovedEvent) => void;   // delete
  onItemMoved?:   (e: TodoItemMovedEvent) => void;     // reparent / reorder
  onFieldEdited?: (e: TodoFieldEditedEvent) => void;   // rename + reschedule keys
  onStatusChanged?: (e: TodoStatusChangedEvent) => void;

  // Permissions (reused from todo-rich-card; mirrors todo-tree)
  permissions?: TodoPermissions;
  canMoveItem?:    (id: string) => boolean;
  canResizeItem?:  (id: string) => boolean;
  canDeleteItem?:  (id: string) => boolean;
  canCreateChild?: (id: string) => boolean;
  canEditItem?:    (id: string) => boolean;
  onPermissionDenied?: (action: keyof TodoPermissionRule, itemId: string, reason: string) => void;
};
```

**Imperative handle additions (sketch):** `addTask(parentId, item?)`, `deleteTask(id)`, `editTask(id)` (open the card), `beginRename(id)`. The v1 handle (scroll/zoom/expand) is unchanged.

**Surface-budget note:** the edit layer adds ~8 feature concepts on top of v1's ~21. The compound absorbs this — edit handlers attach to the existing `Root`; no new mountable region beyond the edit popover. GATE 2 re-counts against the ~25 ceiling and decides whether any edit concern (e.g. the rename field) becomes its own Tier-C part.

---

## 4. Decisions (continuing v1's D1–D12)

| # | Question | Recommendation (confirm at sign-off) |
|---|---|---|
| **D13** | **Edit enablement / backward-compat** | 🟢 Single `editable` master toggle, **default `false`** → byte-for-byte v1 behavior for existing consumers. Affordances are capability-gated (handler present AND permission granted), exactly like `todo-rich-card`. |
| **D14** | **Data ownership** | 🟢 **Controlled-only** (no uncontrolled `defaultData`). Edits fire typed events + `onChange(nextForest)`; consumer echoes into `data`. Rationale: the Gantt is usually one tab sharing `data` with List/Board — a single upstream source of truth; an internal copy would desync the tabs. |
| **D15** | **Create gesture** | 🟢 **Both** — draw-on-canvas (drag start→end on an empty row) **and** a gutter "＋" affordance (add child / sibling / root). *(User-confirmed.)* |
| **D16** | **Reparent + reorder** | 🟢 **In v2**, via gutter DnD reusing the `todo-tree` model (drop-as-sibling / into-children + circular-drop ban). *(User-confirmed.)* |
| **D17** | **Detail editing** | 🟢 **Reuse `<TodoRichCard editable>`** in a popover/sheet (the lazy boundary already exists from the v1 tooltip). No bespoke editor. *(User-confirmed.)* |
| **D18** | **Snapping** | 🟢 Snap to the active **minor unit** by default; `snap` prop overrides (`"hour"`/`"day"`/ms/`"off"`); **Alt** = free-drag for one gesture. |
| **D19** | **Undo/redo** | 🟢 **Consumer-owned** (controlled data makes it free; guide ships a recipe). No built-in history in v2. Revisit only if an uncontrolled mode is added. |
| **D20** | **Permissions + which bars edit** | 🟢 Adopt `todo-rich-card`'s `TodoPermissions` + predicates + `onPermissionDenied`; `locked` blocks all. **Summary bars are NOT directly draggable/resizable** (derived span — you edit children; the summary recomputes). Milestones **are** draggable. |
| **D21** | **Marquee / multi-select + bulk ops** | 🟢 **Defer to v2.1.** Keep v2 single-item. *(Open: confirm you're OK shipping v2 without bulk select.)* |
| **D22** | **`onTaskReschedule` keep vs fold** | 🟢 **Keep** the v1-reserved `onTaskReschedule` as ergonomic bar move/resize sugar; the richer `onFieldEdited`/CRUD events + `onChange(forest)` are the source of truth. Document the relationship. |

---

## 5. Risks

- **Gesture arbitration grows a layer.** v1 already juggles pan/swipe/zoom vs gutter-tree keys. v2 adds bar-drag, edge-resize, draw-to-create, and gutter-DnD. Hit-testing must resolve: bar-edge (resize) > bar-body (move) > empty-row (draw-create) > canvas (pan). Plan must specify the precedence + the thresholds, and keep `disableGestures`/`editable=false` paths clean.
- **Snap + zoom interaction.** Snap unit must track the *active minor unit*, which changes with continuous zoom — a drag that crosses a zoom-scale threshold mid-gesture must not jump. Plan locks "snap unit resolved at drag-start, not per-frame."
- **Forest mutation correctness.** No `parentId` means create/delete/move operate on nested `children`; the host needs a normalized `parentId`+`index` map (mirror `todo-rich-card`'s `TodoNode`). Reparent must ban circular drops (todo-tree precedent). Summary spans + virtualization must recompute after every edit without a full remount.
- **Embedded-card round-trip.** The card edits a *single* `TodoItem` subtree; splicing its result back into the forest must preserve sibling order + identity. The card's `duration` is edited in whole minutes (lossy) — document it. Permissions must pass through consistently so the card doesn't offer an edit the gantt would deny.
- **Backward-compat regressions.** `editable=false` MUST be pixel- and behavior-identical to v1. The cross-backend (Base UI) consumer smoke is the gate (the embedded card + any new shadcn primitive for the popover/context-menu re-opens F-cross-13 risk — check `dropdown-menu`/`context-menu`/`popover` divergence).
- **A11y of editing.** Bar focus + edit keys must not collide with the gutter tree; rename field needs proper focus management; permission-denied needs an announced affordance, not a silent no-op.

---

## 6. Success criteria (v0.2.0 ships when)

1. `editable=false` is a **verified** no-op vs v1 (visual + behavior + smoke).
2. Drag-reschedule, edge-resize, milestone-drag all write correct `startAt`/`expireAt`/`duration`, snap correctly, and respect `end ≥ start` + min width.
3. Create (both gestures), delete, inline rename, and gutter reparent/reorder all fire the correct `todo-rich-card`-shaped events **and** a coherent `onChange(forest)`.
4. Detail editing mounts `<TodoRichCard editable>`, round-trips a subtree, and threads permissions.
5. The `TodoPermissions` matrix + predicates + `locked` gate **every** edit path (keyboard, pointer, DnD, card); `onPermissionDenied` fires with a reason. Summary bars are non-manipulable; milestones are.
6. Undo/redo recipe (consumer-owned) is documented + demonstrated in the demo.
7. Compound integrity holds — a hand-assembled subset still edits; the demo gains an "Editable" tab.
8. Gates: tsc/lint/meta-deps clean · build · cross-backend consumer-tsc smoke CLEAN.

---

## 7. Open questions for sign-off (GATE 1)

1. **D21 — marquee/bulk deferred to v2.1?** (Recommend yes — keeps v2 shippable.)
2. **D19 — undo/redo as a consumer-owned recipe, not built-in?** (Recommend yes — controlled data makes it free.)
3. **D14 — controlled-only (no uncontrolled `defaultData`)?** (Recommend yes — single source of truth with the List/Board tabs.)
4. **D20 — summary bars non-manipulable (edit children instead)?** (Recommend yes — the span is derived.)
5. Anything in §1 "In scope" you want pulled or pushed before I write the GATE 2 plan?

---

## 8. Definition of "done" for THIS document (stage gate)

- [x] Premise = additive-over-v1-seam stated; backward-compat (D13) is the hard constraint.
- [x] Edit-surface inventory (§1) grounded in the **validated** shared vocabulary (`TodoPermissions` + event types from `todo-rich-card`; reuse proven by `todo-tree`).
- [x] Data contract = no new fields (§2); controlled echo `onChange(TodoItem[])`.
- [x] API additions sketched (§3) — additive, capability-gated, imported event/permission types.
- [x] Decisions D13–D22 recorded with recommendations; 4 surfaced as open questions (§7).
- [x] **User sign-off (GATE 1)** — confirmed 2026-06-20 (D14/D19/D20/D21 recommendations accepted) → `gantt-timeline-01-procomp-plan-v0.2.0.md` (GATE 2) now in progress.

After sign-off, changes to this doc are loud and intentional, not silent rewrites.

# `gantt-timeline-01` v0.2.0 — Pro-component Plan (Stage 2 / GATE 2)

> **Stage:** 2 of 3 · **Status:** 🟢 Approved (**GATE 2**, 2026-06-20) — dep cost confirmed; right-click context-menu **included in v2** (user call) → implementation in progress
> **Slug:** `gantt-timeline-01` · **Category:** `data` · **Bump:** v0.1.0 → **v0.2.0** (minor, public-API-touching)
> **Predecessors:** v0.2.0 [description](./gantt-timeline-01-procomp-description-v0.2.0.md) (GATE 1, approved 2026-06-20; D13–D22) + the v0.1.0 [plan](./gantt-timeline-01-procomp-plan.md) (the §4 compound surface + §5 geometry engine + §6 drag seam this builds on).

This is the **how** — the implementation contract for the editing layer. It records ONLY the deltas over v0.1.0. Anything not restated is inherited unchanged. After sign-off (**GATE 2**), implementation begins; deviations are loud and intentional.

> **Reviewer focus:** the gesture-arbitration order (§4 — where v2 adds the most risk), the forest-mutation + permission libs (§3), the controlled-echo data flow (§5 — no internal data state), and the new-primitive / dep surface (§2 — F-cross-13).

---

## 1. Summary

Make the v1 read-only Gantt **editable**, additively. Editing is gated behind `editable` (default `false` → byte-identical v1). Five capabilities: **direct bar manipulation** (drag-move / edge-resize / milestone-drag), **task CRUD** (create via draw-on-canvas + gutter ＋ / delete / inline rename), **gutter reparent-reorder** (@dnd-kit, todo-tree model), **detail editing** (embedded `<TodoRichCard editable>`), and the **shared permission matrix**. Data stays controlled — every edit fires a typed event + `onChange(next: TodoItem[])`; the consumer echoes. No new `TodoItem` fields. No internal data state (the Root computes the next forest from `props.data` and hands it over).

---

## 2. Dependencies (deltas over v1)

### 2.1 — new shadcn primitives (F-cross-13 trigger)

| Primitive | Used by | Why |
|---|---|---|
| `input` | gutter inline rename | the rename text field (mirrors todo-tree's use) |
| `context-menu` | bar (body) + gutter-row right-click | Edit / Rename / Add / Status / Delete actions |

> **Implementation refinement (reduces the planned dep surface):** the **detail editor uses a custom centered overlay** (`gantt-edit-popover.tsx` — a plain backdrop + panel), **NOT the `popover` primitive** — exactly the v1-tooltip philosophy of sidestepping the Radix/Base-UI `asChild` divergence. So the new shadcn surface is just **`input` + `context-menu`** (2 primitives, down from the planned 3). A strict reduction of the cost the user confirmed.

`input` + `context-menu` are **new to this component** → **F-cross-13 re-arms** (the Radix→Base UI divergence: `asChild`, callback contravariance). **Mitigation, locked:** path-(a) per [`sweep-tracker.md` F-cross-13](../../reviews/sweep-tracker.md) + `project_shadcn_primitive_radix_baseui_divergence` — defensive callback contravariance, no reliance on Base-UI-absent props, and the **4-ship pattern** (ship → cross-backend consumer-tsc smoke → patch v0.2.1 if it bites → re-smoke). The embedded card renders behind a `React.lazy` boundary, so the card's own primitives don't add to *our* dep count.

> **GATE-2 user call:** the right-click **context-menu is included in v2** (not deferred). It offers Edit / Add child / Delete / quick-status on both bars (body) and gutter rows, matching description §1. This widens the new shadcn surface to **3 primitives** (`popover` + `input` + `context-menu`) and the F-cross-13 blast radius — accepted by the user. Delete also stays on `Delete`/`Backspace` (focused row/bar); quick-status also via the embedded card's `statusEditable` dropdown.

### 2.2 — new npm

| Package | Used by | Why |
|---|---|---|
| `@dnd-kit/core` `^6.3.1` | gutter reparent/reorder | the exact dep + sensor set todo-tree uses; already a consumer peer via todo-tree/kanban |

No date lib (still epoch-ms + `Intl`). `@dnd-kit/sortable`/`utilities` **not** needed — todo-tree proved `@dnd-kit/core` alone suffices for tree reparent.

### 2.3 — internal (unchanged)

`todo-rich-card` stays the single internal `registryDependency`. v2 imports MORE from it (now also the **event types** + **`TodoPermissions`/`TodoPermissionRule`**) via the same rewriter-safe relative `../todo-rich-card`. The **value** import (`<TodoRichCard>` in editable mode) stays behind `React.lazy` in the edit-popover module — the card's runtime weight loads only when a consumer opens an editor.

---

## 3. New + changed library code (`lib/`)

### 3.1 — `lib/edit-mutations.ts` *(new, pure)*

Pure, framework-free forest operations over `TodoItem[]` — the array analogue of `todo-rich-card`'s reducer mutations, returning a **new** forest (structural sharing; never mutate in place):

```ts
buildIndex(data): Map<id, { item; parentId: string|null; index: number; level: number }>
setWindow(data, id, patch: { startAt?; expireAt?; duration? }): TodoItem[]   // reschedule / resize / milestone-move
renameItem(data, id, name): TodoItem[]
addItem(data, parentId: string|null, item, index?): TodoItem[]               // null parent = root
removeItem(data, id): { next: TodoItem[]; removed: TodoItem; parentId: string|null }
moveItem(data, id, newParentId: string|null, newIndex): TodoItem[]           // reparent + reorder
isAncestor(data, maybeAncestorId, id): boolean                               // circular-drop guard
```

`setWindow` enforces the geometry invariant (`end ≥ start`, min duration); a resize of a `duration`-based item rewrites `duration`, an `expireAt`-based item rewrites `expireAt` (precedence preserved from v1 `lib/geometry.ts`). All are **Vitest-ready** (informed-defer per house convention).

### 3.2 — `lib/edit-permissions.ts` *(new, pure)*

Mirror of `todo-tree/lib/permissions.ts`. Maps gantt actions onto `todo-rich-card`'s `TodoPermissionRule` keys and resolves against `TodoPermissions` (`default`/`byLevel`/`byItem`/`inherit`) + `item.locked`:

```ts
type GanttEditAction = "move" | "resize" | "delete" | "create" | "editDetails";
const ACTION_TO_RULE: Record<GanttEditAction, keyof TodoPermissionRule> =
  { move: "drag", resize: "drag", delete: "remove", create: "addChildren", editDetails: "edit" };
evalGanttPermission(permissions, action, item, level): boolean   // locked ⇒ always false
```

The per-action prop predicates (`canMoveItem` etc.) AND this matrix both gate — a denial fires `onPermissionDenied(rule, id, reason)`.

---

## 4. Gesture arbitration — the heart of v2 (`use-gantt-edit.ts` + body/gutter wiring)

v1's body already runs a pointer state machine with a dominant-direction lock (h = time-pan, v = row-scroll) + pinch + momentum, and a non-passive wheel listener. v2 inserts an **edit branch that wins the hit-test BEFORE pan**, only when `editable` and the target permits.

### 4.1 — body pointer-down hit-test precedence (locked order)

```
1. bar LEFT/RIGHT edge (≤6px)  + canResize → RESIZE gesture
2. bar BODY (or milestone)     + canMove   → MOVE gesture (grab)
3. empty row area              + canCreate → DRAW-CREATE gesture (start→end)
4. otherwise                                → v1 PAN/zoom (unchanged)
```

- Resolved at `pointerdown` from the hit element's `data-*` (bars get `data-itemid` + `data-edge`). If `editable=false` or no permission, **every** branch falls through to (4) — v1 behavior intact.
- The edit gesture **captures the pointer** and suppresses pan/momentum for that gesture (sets a `editDragRef`); `setHover(null)` as today.
- **Snap** resolved **once at drag-start** from the active minor unit (or the `snap` prop) — never per-frame, so crossing a zoom-scale threshold mid-drag doesn't jump (§5 risk).
- Live **preview overlay**: a ghost bar at the snapped position + a cursor-following date label (reuse the v1 floating-div pattern; no new primitive). Commit on `pointerup` → mutation + events; `Esc` cancels.

### 4.2 — keyboard editing (focused **bar**, not gutter row)

Composes with v1's arrows-=-gutter-tree-nav by scoping to bar focus: when a **bar** is focused (v2 makes bars focusable in editable mode only), `←/→` nudge by one snap unit (move), `Shift+←/→` resize the end, `Delete`/`Backspace` delete, `Enter` opens the editor. When a **gutter row** is focused, v1's tree nav is unchanged. (Resolves the v1 a11y model cleanly — the two focus scopes never overlap.)

### 4.3 — gutter reparent/reorder (`@dnd-kit/core`, todo-tree model)

A `<DndContext>` wraps the gutter track (Mouse + Touch + Keyboard sensors). Edge-zone drop math (top 25% sibling-before / middle 50% reparent-as-last-child + auto-expand / bottom 25% sibling-after, 8px cap) lifted from todo-tree. Drop targets gated by `canDropAsSibling`/`canDropIntoChildren` (→ `evalGanttPermission(... "create"/"move")`); circular drops banned via `isAncestor`. Virtualization **suspends during drag** (todo-tree precedent; `use-gantt-virtual.ts` gains a `suspended` flag). Commit → `moveItem` → `onItemMoved` + `onChange`.

### 4.4 — inline rename

Double-click a gutter row name (or `Enter` on a focused row in editable mode) → swap the name span for an `<Input>`; `Enter` commits (`renameItem` → `onFieldEdited{key:"name"}` + `onChange`), `Esc`/blur cancels. Permission `editDetails`.

### 4.5 — right-click context-menu (`context-menu`)

A shared `<GanttContextMenu>` (Tier-C) wraps the menu around a target and offers permission-gated items: **Edit** (`editTask` → popover), **Add child** (`create`), **Add sibling** (`create`), **Delete** (`delete`), and a **Status ▸** submenu over `statusOptions` (`editDetails` → `onStatusChanged`). Used on **bars** (body — `onContextMenu` on the bar wrapper) and **gutter rows**. Right-click (the `contextmenu` event) is independent of the left-button pan/drag pointer logic, so it never triggers pan/move; the menu opens at the cursor. Items whose permission is denied are hidden (not just disabled) to match the affordance-hiding convention. Each chosen action routes through the same `use-gantt-edit` dispatchers as the pointer/keyboard paths (single mutation chokepoint).

---

## 5. State model — still no internal data state (controlled echo)

The Root holds **no copy of `data`.** Every mutation is `next = mutate(props.data, …)` → fire the typed event(s) → fire `onChange(next)`; the consumer echoes into `props.data` and the component re-renders from the new prop. This preserves v1 D3 (controlled) and keeps the Gantt in sync with sibling List/Board tabs (description D14).

The Root gains only **transient UI state** (no data): `editDrag` (active move/resize/draw + its preview geometry), `renameTarget`, `dndDrag`. These live in `use-gantt-edit.ts` and never outlive a gesture. Undo/redo is **consumer-owned** (D19) — because `onChange` hands over a full immutable forest, the consumer's existing history stack captures it for free; the guide ships the recipe.

**`onTaskReschedule` (kept, D22):** bar move/resize ALSO fires the v1 `onTaskReschedule{itemId,startAt,expireAt?}` sugar, in addition to `onFieldEdited` + `onChange`. Documented as sugar; `onChange` is the source of truth.

---

## 6. File-by-file plan

| File | Change |
|---|---|
| `types.ts` | + `GanttEditProps` merged into `GanttTimelineProps` (editable, onChange, snap, the reused event/permission types from `../todo-rich-card`, `can*` predicates). Extend `GanttContextValue` (editable, permission resolver, edit dispatchers, edit-UI state, rename target). Extend `GanttTimelineHandle` (`addTask`/`deleteTask`/`editTask`/`beginRename`). Extend `GanttTimeUnit` use for snap. |
| `lib/edit-mutations.ts` | **new** (§3.1). |
| `lib/edit-permissions.ts` | **new** (§3.2). |
| `hooks/use-gantt-edit.ts` | **new** — transient edit-UI state + mutation dispatchers (compute next forest, fire events + onChange, snap, permission gate). |
| `hooks/use-gantt-virtual.ts` | + `suspended` flag (freeze during gutter DnD). |
| `parts/gantt-timeline-root.tsx` | instantiate `use-gantt-edit`; thread `editable`/handlers/permissions/dispatchers into context; extend imperative handle. **No data state added.** |
| `parts/gantt-timeline-body.tsx` | + edit hit-test branch BEFORE pan (§4.1); drag-preview overlay; bar keyboard editing (§4.2). v1 pan path untouched when `editable=false`. |
| `parts/gantt-bars.tsx` | `GanttBar` + hover resize handles + grab cursor + `data-edge`/`data-itemid` (render only when editable+permitted); `MilestoneDiamond` drag affordance. Read-only render byte-identical when not editable. |
| `parts/gantt-timeline-gutter.tsx` | + `<DndContext>` reparent/reorder (§4.3); inline rename (§4.4); per-row ＋ / delete affordances (button); all permission-gated. |
| `parts/gantt-edit-popover.tsx` | **new** — `popover` hosting the lazy `<TodoRichCard editable value onChange permissions>`; splices the edited subtree back + fires events. (Supersedes/extends `bar-tooltip-full.tsx`'s lazy import — keep one lazy boundary.) |
| `parts/gantt-context-menu.tsx` | **new** — Tier-C `<GanttContextMenu>` wrapping `context-menu` (Edit / Add child / Add sibling / Delete / Status▸); permission-gated; used by body bars + gutter rows (§4.5). |
| `gantt-timeline-01.tsx` | pass `editable` + edit handlers through; empty-state CTA can create the first task when editable. |
| `index.ts` | export `GanttEditPopover` (+ any new public type). |
| `dummy-data.ts` | + a `permissions` fixture (locked node, level-gated) for the demo. |
| `demo.tsx` | + **"Editable"** tab: full CRUD + reparent + edit-in-card + a worked **consumer-owned undo/redo** wiring (proves D19). |
| `usage.tsx` | + editing patterns + the undo recipe. |
| `meta.ts` | version `0.2.0`; shadcn += `popover`,`input`; npm += `@dnd-kit/core`; features rewritten; status stays `alpha`. |
| guide (`…-guide.md`) | + Editing section, permission matrix, undo recipe, the "editable=false is v1" guarantee. |

**Out of the shipped registry** (unchanged): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 7. Final API additions (locked surface for GATE 2)

As sketched in description §3, with these plan locks:

- `editable?: boolean` default **`false`**.
- `onChange?: (data: TodoItem[]) => void` — full mutated forest after any edit.
- `snap?: "minor" | "hour" | "day" | "week" | "off" | number` default **`"minor"`**; Alt = free-drag one gesture.
- Events (imported shapes): `onItemAdded` / `onItemRemoved` / `onItemMoved` / `onFieldEdited` / `onStatusChanged`; plus kept `onTaskReschedule`.
- Permissions: `permissions?: TodoPermissions` + `canMoveItem`/`canResizeItem`/`canDeleteItem`/`canCreateChild`/`canEditItem` + `onPermissionDenied`.
- Handle: `addTask(parentId, item?)` · `deleteTask(id)` · `editTask(id)` · `beginRename(id)`.

**Feature-concept count:** v1 ~21 + ~8 edit = **~29** raw, but controlled/uncontrolled pairs don't apply (controlled-only) and the `can*` predicates collapse into one "permissions" concept → **~25**, at the ceiling. The compound absorbs it (edit handlers on the existing Root; one new mountable region = the edit popover). If implementation pushes past, the `can*` predicates fold entirely into `permissions` (drop the prop-fn shortcuts).

---

## 8. Edge cases (deltas)

| Case | Handling |
|---|---|
| `editable=false` | Zero edit affordances, zero new listeners; pixel/behavior-identical to v1 (the backward-compat gate). |
| resize below min width | clamp to min duration; never invert (`end ≥ start`). |
| drag a summary (parent) bar | **no-op** — summaries are derived (D20); only children move. Cursor stays default on summaries. |
| drag a milestone | moves the instant (`startAt`); stays a milestone (no `expireAt`/`duration` introduced). |
| reparent into own descendant | banned (`isAncestor`); `onPermissionDenied(... "circular-drop")`. |
| delete a collapsed parent | removes the whole subtree; `onItemRemoved.removed` carries it (consumer can undo). |
| create on empty canvas | draw start→end; new item seeded with `setAt=startAt`, `status=statusOptions[0]`, fresh `id` (handler may override). |
| locked item | all edits denied (matrix); affordances hidden; v1 lock glyph stays. |
| edit mid-gesture data change | controlled echo means `props.data` updates between gestures, not during (pointer capture holds the gesture); preview reads the at-drag-start snapshot. |

---

## 9. Verification plan (pre-GATE-3)

1. `tsc` / `lint` / `validate:meta-deps` clean (new deps declared + imported; `popover`/`input`/`@dnd-kit/core`).
2. `build` ✓.
3. **Backward-compat proof:** the existing demo tabs (non-editable) render + behave identically; a diff/screenshot check on `editable=false`.
4. `registry:build`; artifact spot-check (no demo/usage/meta; `popover`/`input` in `registryDependencies`; `@dnd-kit/core` in `dependencies`; relative `../todo-rich-card` preserved).
5. **Editable demo** exercises every surface + the undo recipe.
6. Pure-lib Vitest-ready (`edit-mutations` round-trips, `edit-permissions` matrix, snap).
7. **GATE 3:** spotcheck, rotating dim = **Robustness** or **Public API** (the edit surface + F-cross-13). **Mandatory cross-backend (Base UI) consumer-tsc smoke** (new `popover`/`input` primitives) per the 4-ship pattern.

---

## 10. Risks (deltas — full v1 risk list still applies)

- **Gesture precedence bugs** — the §4.1 order must be exact + `editable=false`-safe; a leaked edit listener that breaks v1 pan is the top regression. Prototype the hit-test first.
- **Snap × continuous-zoom** — resolve snap unit at drag-start, not per-frame (§4.1).
- **Forest-mutation identity** — structural sharing + correct `parentId`/`index`; reparent must preserve sibling identity; summaries + virtualization recompute without remount.
- **F-cross-13** — `popover`/`input` Base-UI divergence; defensive contravariance + 4-ship smoke (§2.1).
- **Embedded-card round-trip** — splice the card's edited subtree back without losing siblings; pass permissions through; `duration` whole-minute lossiness documented.
- **A11y** — bar focus vs gutter-tree focus scopes mustn't overlap (§4.2); permission-denied is announced, not silent.

---

## 11. Definition of "done" for THIS document (stage gate)

- [x] Edit layer specified as deltas over v1 (no full restate).
- [x] Gesture arbitration order locked (§4.1); keyboard scope split (§4.2); gutter DnD = `@dnd-kit/core` todo-tree model (§4.3).
- [x] Forest-mutation + permission libs specified, pure + Vitest-ready (§3).
- [x] Controlled-echo data flow (no internal data state) locked (§5).
- [x] Dep deltas + F-cross-13 mitigation + context-menu→v2.1 refinement locked (§2).
- [x] File-by-file (§6) maps onto the real v1 sealed folder; API additions locked (§7).
- [x] **User sign-off (GATE 2)** — confirmed 2026-06-20 (dep cost accepted; context-menu included in v2) → implementation in progress (folder exists; edit files in place) → GATE 3.

After sign-off, deviations from this plan are loud and intentional, not silent.

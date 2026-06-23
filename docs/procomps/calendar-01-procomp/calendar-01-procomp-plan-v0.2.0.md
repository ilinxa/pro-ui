# `calendar-01` v0.2.0 — Pro-component Plan (Stage 2 / GATE 2)

> **Stage:** 2 of 3 · **Status:** 🟢 Approved (**GATE 2**, 2026-06-22) — DnD hybrid locked, export-OUT cut, cross-doc audit clean.
> **Build progress (2026-06-23):** Stages **1–3 of 4 implemented + green** (month edit · week/day time-grid + F-03 band · inspector panel · quick-composer · context-menu · live resize preview · status-driven color · high-priority flag). **Stage 4 NOT started** (keyboard editing · cross-view/external DnD · F-04 responsive overflow). Self-review 2026-06-23 = **Pass with follow-ups** (0 blockers; see §14b). Checkpoint-committed (NOT shipped — no meta/registry bump, no GATE 3 spotcheck file yet).
> **Slug:** `calendar-01` · **Category:** `data` · **Tier:** pro-component (shadcn-style compound)
> **Bump:** v0.1.0 → **v0.2.0** (minor; public-API-touching)
> **GATE 1:** [description-v0.2.0](./calendar-01-procomp-description-v0.2.0.md) — 🟢 Approved 2026-06-22 (D14–D25; recommendations re-validated)
> **Precedent read + mirrored:** gantt's [`lib/edit-mutations.ts`](../../../src/registry/components/data/gantt-timeline-01/lib/edit-mutations.ts), [`lib/edit-permissions.ts`](../../../src/registry/components/data/gantt-timeline-01/lib/edit-permissions.ts), [`hooks/use-gantt-edit.ts`](../../../src/registry/components/data/gantt-timeline-01/hooks/use-gantt-edit.ts), [`parts/gantt-context-menu.tsx`](../../../src/registry/components/data/gantt-timeline-01/parts/gantt-context-menu.tsx).

This is the **how**. It locks the API, the compound export surface, the DnD architecture, the per-view gesture arbitration, the pure mutation/permission libs, the edit hook, the new parts, keyboard, cross-view/external DnD, F-03/F-04, the all-day⇄timed round-trip, a11y, deps, and the file-by-file build sequence. Everything is **additive over v1**; `editable=false` is byte-identical to v0.1.0.

---

## 1. Final API (locked)

The CRUD/field/permission props + `addTask`/`deleteTask`/`editTask` are **already in `CalendarProps`/`CalendarHandle`** (the inert v0.2.0 fence in [`types.ts`](../../../src/registry/components/data/calendar-01/types.ts)). They go live unchanged. v0.2.0 **adds only**:

```ts
// CalendarProps additions (everything else already declared):
snap?: CalendarSnap;                  // default "15min"
quickCompose?: boolean;               // default true (when editable); false → create opens the full card
onExternalDrop?: (date: Date, allDay: boolean, data: DataTransfer) => void; // accept drops INTO the calendar (e.g. a sidebar tray)
renderQuickComposer?: CalendarQuickComposerRenderer;

// new exported types
export type CalendarSnap = "minute" | "5min" | "15min" | "30min" | "hour" | "day" | "off" | number;
export type CalendarEditAction = "move" | "resize" | "delete" | "create" | "editDetails";
export type CalendarQuickComposerRenderer = (args: {
  date: Date; allDay: boolean; defaultEnd: Date;
  commit: (seed: Partial<TodoItem>) => void; cancel: () => void; openFull: () => void;
}) => ReactNode;
```

**Handle:** `addTask`/`deleteTask`/`editTask` go live; **add** `beginRename(id)` + `openQuickComposer(date, allDay?)`.

**`onItemMoved` semantics (locked):** in the calendar, the dominant "move" is **reschedule** (date/time change) → it fires `onFieldEdited("startAt"/"expireAt")` + `onTaskReschedule` + `onChange`, **not** `onItemMoved`. `onItemMoved` (reparent) stays declared for vocabulary symmetry and fires **only** if a future cross-view "drop-onto-an-event-to-nest" gesture lands — **not wired in v0.2.0** (documented as reserved). This avoids overloading reschedule with the reparent event the card/tree/gantt use for hierarchy changes.

**Surface budget:** v1 was ~21 concepts; the edit layer adds ~10 (editable, onChange, 5 events, permissions block, snap, quickCompose, renderQuickComposer, onExternalDrop). Absorbed by the compound — handlers attach to the existing `Calendar01Root`; only two new mountable regions (quick-composer + context-menu).

---

## 2. Compound export surface (three tiers — MANDATED by [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md))

Editing attaches to the **existing** tiers; no monolith, no god-prop. Flat exports only.

**Tier B — `Calendar01Root` (existing, extended).** Now also: constructs the edit hook (`useCalendarEdit`), holds the **single `DndContext`** (cross-cutting — so a hand-assembled subset gets DnD too, per the rule), and threads the edit dispatchers + transient edit state into context. No new provider.

**Tier B — context parts (existing view parts, extended + 1 new):**
- `CalendarMonthView` / `CalendarWeekView` / `CalendarDayView` / `CalendarAgendaView` — gain drag/resize/draw/drop affordances, all read from context, all gated on `editable` + capability. Read-only path untouched when `editable=false`.
- **`CalendarContextMenu`** (NEW, Tier B) — wraps the event/cell with a right-click menu (edit / delete / quick-status / quick-priority). Reads context. Mirrors `gantt-context-menu`.

**Tier C — standalone primitives (existing + 1 new):**
- Existing `CalendarEventChip` / `CalendarEventBar` / `CalendarTimeBlock` / `MonthDayCell` / `TimeGrid` / `NowIndicator` / `AgendaRow` gain prop-driven edit affordances (resize handles, `draggable`, selected ring) — still context-free; the Tier-B wrapper passes handlers down.
- **`CalendarQuickComposer`** (NEW, Tier C) — dumb popover: title input + all-day/time control + Save/Cancel/"More options". Prop-driven (`onCommit`/`onCancel`/`onOpenFull`); zero context. Overridable via `renderQuickComposer`.

**Tier A — `Calendar01` assembly (existing, extended).** Adds nothing logic-wise — mounts the same parts; the new affordances appear because `editable` flows to the parts. New demo tab "Editable" proves it; a hand-assembled subset still edits (compound integrity check at GATE 3).

**Lazy boundaries preserved:** the detail editor reuses the **existing** lazy `event-tooltip-full` boundary (which today mounts a read-only `<TodoRichCard>`) and adds an `editable` mount path on it — no new lazy import. `@dnd-kit/core` is small + always needed when editing, so it is a normal import inside the parts (not lazy); a read-only consumer (`editable=false`) still pays for it only if they mount an editable view — acceptable (matches gantt). *(GATE 2 note: if we want `editable=false` consumers to never bundle @dnd-kit, the DndContext + draggable wiring must sit behind a `React.lazy` editable-layer — flagged as an optimization, default is plain import for v0.2.0.)*

---

## 3. DnD architecture (the key fork — decided: **hybrid**)

Mirrors gantt's proven split (gantt used `@dnd-kit` for the list-y gutter reparent + **native pointer** for the canvas geometry). Calendar's geometry maps cleanly:

| Gesture | Mechanism | Why |
|---|---|---|
| **Move / reschedule** (incl. cross-view) | **`@dnd-kit/core`** — `DndContext` on Root; events `useDraggable`; cells/slots/all-day-band `useDroppable` | "Pick up an event, drop it on a date/slot" is @dnd-kit's exact sweet spot; cross-view falls out because one `DndContext` spans all four views; gives keyboard-DnD + a11y for free |
| **Edge-resize** | **native pointer** (pointerdown on edge handle → pointermove transient → pointerup commit) | Pixel→time continuous geometry; @dnd-kit is not a resize tool. Edge handles `stopPropagation` so the @dnd-kit sensor never claims them |
| **Draw-to-create** | **native pointer** on empty cell/slot → range → open quick-composer | Empty cells aren't draggables; native pointerdown owns them |
| **External drop IN** | **native HTML5** `onDragOver`/`onDrop` on the same cells → `onExternalDrop(date, allDay, dataTransfer)` | External sources speak HTML5 DnD, not @dnd-kit's pointer model; separate channel. Drop *targets* only — no @dnd-kit conflict (cells aren't draggables) |

**Scope note (export-OUT cut, user 2026-06-22):** dragging a calendar event *out* to an external app is **out of scope** (no `draggable`/`onDragStart` on events, no `exportDragType` prop). This removes the only native-HTML5-drag × @dnd-kit-PointerSensor conflict, so there is **no hedged sub-item** — v0.2.0 DnD is fully committed. Cross-view drag (internal) + external drop-IN remain.

**Implementation refinement (Stage 2, 2026-06-22):** the hybrid is split by **surface geometry**, not gesture type. The **day-granular** surfaces (month grid + the all-day band) use **@dnd-kit** for move (whole-day drops resolve in `Calendar01Root`'s `onDragEnd`) — shared via `parts/calendar-edit-affordances.tsx` (`DraggableEventWrap`/`DayResizeGrip`/`DeleteAffordance`). The **continuous time grid** (week/day timed blocks) uses a **native-pointer** layer for move + resize + draw — pixel↔time math against the column rect, snapped — exactly gantt's canvas approach (the discrete @dnd-kit model fights continuous time). Cross-view drag *into* the time grid (agenda → slot) lands in **Stage 4** and will add @dnd-kit droppables to the grid alongside the native move layer (they coexist).

---

## 4. Gesture arbitration (hit-test precedence, per view)

The `editable=false` path skips ALL of this (read-only handlers only). When editable, precedence on pointerdown:

**Month view (day grid):**
1. event **bar edge** (multi-day) → native resize
2. event **body** → @dnd-kit drag (move)
3. **empty cell** → native draw-to-create (drag across cells) OR click → quick-composer at that day
4. (`onExternalDrop` listens on every cell in parallel via HTML5 channel — independent of the above)

**Week / Day view (time grid):**
1. block **top/bottom edge** → native resize (start/end time)
2. block **body** → @dnd-kit drag (move; vertical = time, horizontal in week = day)
3. **all-day band** item edge → resize; body → @dnd-kit drag along the band
4. **empty column** → native draw-to-create (vertical range = timed start→end) OR click slot → quick-composer (default duration)

**Agenda view (list):** events are @dnd-kit drag sources (drop onto another view's target via cross-view) + right-click context-menu + click → detail. No resize/draw (list has no canvas).

**Thresholds:** edge zone = 6px (or 25% of bar width, whichever smaller); drag activation = 5px; snap resolved at **drag-start** (D22), not per-frame, so crossing a zoom/scale boundary mid-gesture doesn't jump.

---

## 5. Pure lib modules (framework-free, Vitest-ready)

### `lib/edit-mutations.ts` — mirror gantt's, with the all-day delta

Copy gantt's structure verbatim where it applies: `ForestNodeInfo`, `buildIndex`, `replace`, `renameItem`, `addItem`, `removeItem`, `moveItem`, `isAncestor`, `MIN_DURATION_MS`. **Do NOT copy** `subtreeLeaves`/`shiftSubtree` (group-move — not a calendar concern per D20; parent moves alone via `setWindow`).

**The calendar-specific delta — `setWindow` is all-day aware.** Gantt's `setWindow` is ISO-string-in (`patch: { startAt?, expireAt?, duration? }`) and only re-serializes `expireAt` via `new Date(endMs).toISOString()`. Calendar instead takes **epoch ms + an `allDay` flag** and must round-trip serialization through the floating-local path, or it reintroduces the v1 off-by-one (description §5 risk). Add a formatter that is the inverse of `classify.ts`'s `parseDateValue`:

```ts
import { parseDateValue } from "./classify";
/** Inverse of parseDateValue: date-only → LOCAL YYYY-MM-DD (never toISOString); timed → full ISO. */
export function formatDateValue(ms: number, allDay: boolean): string {
  if (!Number.isFinite(ms)) return ""; // caller guards; never emit new Date(NaN).toISOString()
  if (allDay) {
    const d = new Date(ms);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; // LOCAL fields
  }
  return new Date(ms).toISOString();
}

/** setWindow(data, id, { startMs?, endMs?, allDay }) — writes start/expire using the
 *  all-day-aware formatter, preserving the duration-vs-expireAt driver (gantt rule),
 *  enforcing end ≥ start + MIN_DURATION_MS for timed (no min clamp for all-day spans). */
```

`setWindow` takes **epoch ms + an `allDay` flag** (not raw ISO strings) so the geometry layer hands it numbers and the formatter decides the serialization. The `allDay` flag is the gesture's target band (drop on all-day band ⇒ allDay true; drop on time grid ⇒ false) — **this is the all-day⇄timed toggle**, written purely by re-serializing existing fields (no `TodoItem` fork, §11).

Finite guards everywhere (gantt G2 lesson): unparseable → leave the field untouched, never `new Date(NaN).toISOString()`.

### `lib/edit-permissions.ts` — near-copy of gantt's

`evalCalendarPermission(permissions, action, item, level)` — **identical** body to `evalGanttPermission`, with `CalendarEditAction` and the same `ACTION_TO_RULE` map (`move`/`resize`→`drag`, `delete`→`remove`, `create`→`addChildren`, `editDetails`→`edit`). `item.locked` denies all; byItem→byLevel→default→`true`; `inherit !== false`.

---

## 6. The edit hook — `hooks/use-calendar-edit.ts`

A near-mirror of `use-gantt-edit.ts` (the chokepoint pattern: re-check permission `guard` → compute next forest via pure mutations → fire typed event → `onChange(next)`; no internal data copy; `can()` returns false when `!editable` so every dispatcher no-ops). **Deltas from gantt:**

- **Drop** `canGroupMove` / `moveSubtree` (no group-move).
- **`rescheduleItem(id, { startMs, endMs?, allDay }, kind)`** — calls the all-day-aware `setWindow`; fires `onFieldEdited("startAt"/"expireAt")` gated on instant-change (gantt's phantom-event guard, G4) + `onTaskReschedule` + `onChange`. The `allDay` flag flips serialization.
- **`createItem(parentId, seed, { startMs, endMs, allDay })`** — seeds `startAt`/`expireAt` via `formatDateValue` from the gesture range (gantt seeded only `setAt`); fresh id `cal-<uuid>` (crypto-guarded fallback like gantt); fires `onItemAdded` + `onChange`.
- **`deleteItem`, `renameItemAction`, `changeStatus`, `changePriority`** (add priority alongside gantt's status), **`applyEditedSubtree`** (splice the card's edited subtree back, with gantt's deleted-while-open guard, G10), **`openEditor`/`closeEditor`/`beginRename`/`endRename`** — copied.
- Transient state: `editingId`, `renamingId`, **`composerTarget`** (`{ date, allDay, defaultEnd } | null` for the quick-composer).
- `moveItemAction` kept (for the reserved reparent path) but **not invoked** by any v0.2.0 gesture (see §1).

Returns the dispatcher bag + transient state into the context value (new `CalendarContextValue` fields: `editable`, `snap`, `can`, the dispatchers, `editingId`, `renamingId`, `composerTarget`).

---

## 7. New parts

### `parts/calendar-quick-composer.tsx` (Tier C + thin Tier-B wrapper)
- **Tier C** `CalendarQuickComposer` — a `Popover` (already a dep) anchored at the gesture: `Input` (NEW dep) title (autofocus), an all-day `Switch`/time control prefilled from the gesture, Save / Cancel / **"More options"**. `Enter` commits, `Esc` cancels. Prop-driven; `renderQuickComposer` overrides the whole body.
- **Tier B** wrapper reads `composerTarget` from context → renders the composer → `commit` calls `createItem`, `openFull` calls `createItem` then `openEditor` on the new id (or opens a blank card), `cancel` clears `composerTarget`.

### `parts/calendar-context-menu.tsx` (Tier B) — mirror `gantt-context-menu`
- shadcn `ContextMenu` (NEW dep): Edit (→ `openEditor`), Rename (→ `beginRename`), Delete (→ `deleteItem`), submenu Status (over `statusOptions` → `changeStatus`), submenu Priority (over `priorityOptions` → `changePriority`). Items hidden when the corresponding `can()` is false (capability-gated). Cross-backend caveat: keep `ContextMenuTrigger` usage Radix/Base-UI-safe per the F-cross-13 notes.

### Detail editor — **reuse**, don't rebuild
The existing `event-tooltip-full.tsx` already lazy-imports `<TodoRichCard>`. Add an **editable** mount path: when `editingId` is set, render `<TodoRichCard editable permissions={...} onChange={applyEditedSubtree} />` inside a `Popover`/overlay anchored at the event. No new lazy boundary; the read-only tooltip path is unchanged.

---

## 8. Keyboard map (D21 — scoped to event/cell focus; no collision with v1 `M`/`W`/`D`/`A` + period keys)

| Focus | Key | Action |
|---|---|---|
| event | `←`/`→` | move by one snap unit (day in month; minute-increment in week/day) |
| event | `Shift`+`←`/`→` (+`↑`/`↓` in time grid) | resize by one snap unit |
| event | `Delete`/`Backspace` | delete (gated) |
| event | `Enter` | open detail editor |
| event | `F2` | inline rename |
| empty cell | `Enter` / typing | open quick-composer for that day/slot |

All routed through the same dispatchers (so permissions + events + echo are identical to pointer paths). `@dnd-kit`'s `KeyboardSensor` provides drag-by-keyboard as a bonus but the explicit arrow map above is the primary, predictable path.

---

## 9. Cross-view + external DnD (D19)

- **Internal cross-view:** one `DndContext` on Root; `onDragEnd` resolves the droppable (cell / slot / band) → derives `{ startMs, endMs, allDay }` → `rescheduleItem`. Because all views mount under the same context, dragging an agenda row onto a month cell "just works."
- **External IN:** every cell/slot also carries native `onDragOver`(preventDefault)/`onDrop` → `onExternalDrop(date, allDay, e.dataTransfer)`. The consumer creates the item in their handler + echoes via `data` (we don't parse foreign shapes).
- **Export OUT: cut** (user 2026-06-22) — events are not draggable to external apps. No `exportDragType`, no native `draggable` on events.
- **Demo:** ship an "Unscheduled tasks" tray beside the calendar as the **reference external integration** (drag a tray task onto a day → `onExternalDrop` creates it). Demo-only; keeps the component boundary typed.

---

## 10. F-03 / F-04 (fold-in, D25)

- **F-03 — all-day band = column-spanning bars.** Reuse the month spanning-bar segment logic (`lib/segments.ts`) for the week/day all-day band so a multi-day all-day item draws one continuous bar across the day columns instead of a chip per day. Prereq for clean all-day drag/resize.
- **F-04 — height-responsive month overflow.** The type already declares `maxEventsPerCell` default = height-responsive (types.ts:134). Implement: derive the visible-event count from measured cell height (`ResizeObserver`, rAF-coalesced per gantt G8) ÷ row height; `maxEventsPerCell` prop still overrides with a fixed cap. "+N more" recomputed from the responsive count.

---

## 11. All-day ⇄ timed conversion (the floating-local round-trip)

The single most bug-prone path. Rules:
- Drop a **timed** block onto the **all-day band** → `setWindow(..., { allDay: true })` → `formatDateValue` writes date-only `YYYY-MM-DD` from **local** fields. Item re-classifies as all-day (the 3-layer rule, layer 3) on the echo. No field added — just a date-only serialization.
- Drop an **all-day** item onto a **time slot** → `setWindow(..., { allDay: false, startMs, endMs })` → full ISO; re-classifies as timed.
- All reads stay through `parseDateValue` (floating-local). **Test matrix (Vitest-ready):** all-day→timed→all-day must round-trip to the same calendar date in a negative-UTC offset (the exact v1 off-by-one trap).

---

## 12. Accessibility

- Edit affordances are real `<button>`s / focusable handles; resize handles have `aria-label`.
- `onPermissionDenied` drives an announced, non-silent affordance (not a dead no-op).
- Quick-composer + rename field: focus trap + autofocus + `Esc` restore focus to the originating event/cell.
- @dnd-kit `KeyboardSensor` + `DragOverlay` give announced keyboard DnD; the context-menu is keyboard-navigable (shadcn default).
- Event edit keys are active only on event/cell focus — never colliding with the toolbar's view/period keys (v1).

---

## 13. Dependencies

- **NEW shadcn:** `context-menu`, `input`. (`popover`, `tooltip`, `toggle-group`, `calendar`, `avatar`, `badge`, `button`, `skeleton` already deps.)
- **NEW npm:** `@dnd-kit/core` (same dep gantt added — already proven in the registry).
- **Internal:** `@ilinxa/todo-rich-card` already a registryDependency (the editable card + the vocabulary).
- **F-cross-13:** the new `context-menu` + `input` re-arm the cross-backend trap → the F-02 Base-UI consumer-tsc smoke is now the **ship gate**, not optional. Pre-wire `ContextMenuTrigger` defensively per the divergence notes.
- All new files obey the registry import rule (only `react`, `@/components/ui/*`, `@/lib/utils`, declared deps, and the `../todo-rich-card` relative barrel). No `next/*`.

---

## 14. File-by-file plan + build sequence (one v0.2.0, 4 checkpoints)

**New files:**
- `lib/edit-mutations.ts` · `lib/edit-permissions.ts` · `hooks/use-calendar-edit.ts`
- `parts/calendar-quick-composer.tsx` · `parts/calendar-context-menu.tsx`

**Edited files:**
- `types.ts` (+`CalendarSnap`/`CalendarEditAction`/`CalendarQuickComposerRenderer`, +`snap`/`quickCompose`/`onExternalDrop`/`renderQuickComposer`, +context fields, +handle methods)
- `parts/calendar-root.tsx` (wire `useCalendarEdit` + `DndContext` + handle methods live)
- `parts/calendar-month-view.tsx` · `calendar-week-view.tsx` · `calendar-day-view.tsx` · `calendar-agenda-view.tsx` (drag/resize/draw/drop affordances)
- `parts/calendar-time-grid.tsx` (all-day band F-03; slot drop targets) · `parts/calendar-event.tsx` (resize handles, draggable, selected ring) · `parts/calendar-month-view` overflow (F-04)
- `parts/event-tooltip-full.tsx` (editable card mount path)
- `index.ts` (export the 2 new parts) · `meta.ts` (version 0.2.0, features, deps, description) · `demo.tsx` (Editable tab + external tray) · `usage.tsx` · `dummy-data.ts` (a few editable-friendly events)
- `registry.json` + guide (consumer docs) updated at ship.

**Build sequence (checkpoints — each compiles + the read-only path stays green):**
1. **Foundation + Month.** `edit-mutations` (+`formatDateValue`) + `edit-permissions` + `use-calendar-edit` + Root wiring + `DndContext`. Month drag-move + multi-day resize + click/draw create (composer stub) + delete + permissions + controlled echo. Gate: `editable=false` byte-identical.
2. **Week/Day + all-day band (F-03).** Time-grid drag/resize/draw; all-day band spanning bars + band drag/resize; all-day⇄timed round-trip + its Vitest matrix.
3. **Composer + detail + context-menu + quick-status/priority.** `calendar-quick-composer` + `calendar-context-menu` + editable card mount.
4. **Keyboard + cross-view/external DnD + F-04.** Arrow/Shift/Del/Enter/F2 map; cross-view drop; native external IN + `onExternalDrop` (drop-in only); responsive month overflow; demo external tray.

Then: docs (guide), `validate:meta-deps`, `registry:build`, GATE 3 review, F-01 walkthrough + F-02 cross-backend smoke, ship after confirm.

---

## 14b. Implementation addendum — visual model (added during build, 2026-06-22/23, user-directed)

Two visual changes were added **after** GATE 2 sign-off, on direct user feedback, and are NOT in §1–§13 above. Recorded here so the docs match the code.

**A. Event color is STATUS-driven (was time-urgency).** User feedback: *"statuses do not affect color — color is connected to time — make it related to the status."* v1 colored an **active** event by the time-elapsed urgency ramp (matching todo-rich-card + gantt). v0.2.0 reworks `lib/color.ts` `eventColor`:
- precedence: `item.borderColor` → **`statusColors[item.status]`** → tone `done`(muted)/`blocked`(destructive) → `colorBy==="urgency"` ? urgency-ramp : `var(--primary)`.
- New props: **`statusColors?: Record<string,string>`** (per-status accent) + **`colorBy?: "status" | "urgency"`** (default **`"status"`**).
- ⚠️ **Deliberate behavior change vs v1:** with the new default, a v1 read-only consumer who upgrades **without** `colorBy="urgency"` sees active events recolor from the urgency ramp to their status color (or flat `--primary` if no `statusColors`). This is the **one place v0.2.0 is NOT byte-identical to v1's read-only output** (description §0/D14). It is **intentional + user-directed**; `colorBy="urgency"` restores v1 exactly. Flag in the guide + the v0.2.0 changelog as a minor visual breaking change.

**B. High-priority flag.** Priority had no on-grid signal (only the inspector badge + context menu). New prop **`flagPriority?: (item: TodoItem) => boolean`** → occurrences gain **`flagColor?`** (= the item's `priorityOptions` color, fallback `--destructive`) → a small solid `Flag` icon renders on chips/bars/blocks/agenda rows. Opt-in; demo uses `(i) => i.priority === "high"`.

**New exported types (added to barrel):** `CalendarSnap`, `CalendarEditAction`, `CalendarComposerTarget`, `CalendarQuickComposerRenderer`. Also `statusColors`/`colorBy`/`flagPriority` threaded through `OccurrenceContext` + the Root's occurrences memo.

**GATE-3-review follow-ups carried (2026-06-23 self-review, "Pass with follow-ups"):** F-01 colorBy-default doc (this addendum) · F-04 live-preview re-renders whole context per pointermove (isolate to a preview-only context, perf) · F-05 `onExternalDrop`/`getItem` inert until Stage 4 · F-06 `moveItemAction` reserved · F-07 dedupe `changeStatus`/`changePriority`/`applyEditedSubtree` via `replace()` · F-09 `onTaskReschedule` coarse-gating · F-10 meta/registry deps + new files at ship · F-11 composer/inspector focus-restore (with Stage 4 keyboard).

---

## 14c. Stage 4 — cross-surface interop is COPY/PASTE, not drag (deviation from §1 / §3 / §9; built 2026-06-23, user-approved)

A deep review before Stage 4 surfaced that the assembly renders **one view at a time** ([calendar-01.tsx](../../../src/registry/components/data/calendar-01/calendar-01.tsx)), so §9's "cross-view drag (agenda → month)" can't happen on one screen. With the user, the cross-surface mechanism was redefined:

- **Copy / Cut / Paste over a shared `TodoItem` clipboard envelope** (new pure [`lib/clipboard.ts`](../../../src/registry/components/data/calendar-01/lib/clipboard.ts) — `text/plain`, `kind:"ilinxa/task"`). It spans **every** task-family surface (calendar/gantt/kanban/tree/rich-card) via the OS clipboard — something drag can't do. **Paste-target decides all-day vs timed**, subsuming §11's conversion. Document-level `copy/cut/paste` listeners gated on the calendar owning focus (skipped over text inputs + while an edit transient is open); a `pasteTasks` dispatcher re-ids each root (`reassignTaskIds`, mirrored locally — `todo-rich-card`'s isn't barrel-exported) and seeds the target window; one `onChange` per paste. Context-menu gains **Copy/Cut/Rename**.
- **Keyboard editing (§8)** shipped: `←/→` move · `Shift+←/→` (+`↑/↓` in the time grid) resize · `Delete` · `Enter` open editor · `F2` rename · month day-cell `Enter` → composer. Delegated off `data-occ-id`/`data-day-ms`; no collision with v1 view/period keys; focus-restore (F-11) on transient close.
- **F-04 (§10)** shipped: month rows fill the available height; a rAF-gated `ResizeObserver` derives the visible-event cap (`maxEventsPerCell` overrides). **This makes month overflow read-only-visible — a 2nd intentional non-byte-identical-to-v1 spot beside (A).** Unbounded height ≈ cap 3 (no surprise); the override restores a fixed cap.
- **Latent gaps completed:** Stage 1–3 declared `editingId`/`renamingId` but only the inspector rendered the editor (dead when `showInspector=false`, the default) and rename had no surface at all. New [`parts/calendar-edit-overlays.tsx`](../../../src/registry/components/data/calendar-01/parts/calendar-edit-overlays.tsx) adds a `GanttEditPopover`-style modal **editor overlay** (assembly mounts it only when there's no inspector → no double-render) + an **inline-rename** popup, plus a shared `EventEditorPanel` reused by the inspector. So Edit/Enter/F2 now work in the default assembly. `openEditor` now also selects (so the inspector path can't be a no-op).
- **Deferred / reserved (not built):** external HTML5 drag tray (`onExternalDrop` stays **declared + inert**, JSDoc marked reserved), agenda-row dragging (no on-screen target), bespoke conversion-drag (paste subsumes it), time-grid empty-slot keyboard create (continuous surface).
- **a11y limitation (carried, = gantt's overlay):** the modal overlays set `role="dialog"`/`aria-modal` + initial focus + Esc/backdrop close, but do **not** trap Tab — a native `<dialog>` migration for both task-family overlays is a follow-up.
- **New public surface:** `pasteTasks` (hook) · clipboard exports (`serializeTasks`/`parseTasks`/`reassignTaskIds`/`writeTasksToClipboardEvent`/`readTasksFromClipboardEvent` + `TaskClipboardEnvelope`) · parts `CalendarEventEditorOverlay`/`CalendarRenameField`/`EventEditorPanel` · context-menu Copy/Cut/Rename. **No new deps / no new shadcn primitive.**
- **Verification:** tsc 0 · eslint (calendar) 0 · meta-deps 57/57 · build 66/66 (no SSR err). Reviewed by 3 adversarial passes (correctness / consistency / design-a11y) — **Pass with follow-ups, 0 blockers**; fixed in-review: dead Edit/Enter under inspector, keyboard all-day-resize off-by-one + corrupt-window, milestone-resize gate, menu-Cut data-loss guard, clipboard-bail-while-editing, dead `onTaskClick` prop, `onExternalDrop`/`onDateClick` JSDoc honesty, editor-overlay initial focus.
- **Follow-up:** hoist [`lib/clipboard.ts`](../../../src/registry/components/data/calendar-01/lib/clipboard.ts) → todo-rich-card (the shared vocabulary) and adopt in gantt/kanban/tree — the "between all task-management models" epic.

**Still owed (ship steps, NOT done here):** `meta.ts` → 0.2.0 + add `context-menu`/`input` shadcn deps + rewrite the editing feature line · add the new files (`lib/clipboard.ts`, `lib/edit-mutations.ts`, `lib/edit-permissions.ts`, `hooks/use-calendar-edit.ts`, `parts/calendar-edit-overlays.tsx`, `parts/calendar-context-menu.tsx`, `parts/calendar-quick-composer.tsx`, `parts/calendar-event-inspector.tsx`, `parts/calendar-edit-affordances.tsx`) to `registry.json` · `pnpm registry:build` · guide v0.2 · GATE 3 spotcheck file · cross-backend consumer-tsc smoke (re-arms F-cross-13) · ship.

---

## 15. Definition of "done" for THIS document (stage gate)

- [x] API locked (§1) — declared surface + `snap`/`quickCompose`/`onExternalDrop`/`renderQuickComposer`; `onItemMoved` semantics pinned.
- [x] Compound surface (§2) — three tiers, flat exports, 2 new parts, Root holds DndContext, lazy boundary reused; tree-shaking + "Root holds context" stated.
- [x] DnD architecture decided (§3 hybrid). Export-OUT cut (user 2026-06-22) → no hedged sub-items; v0.2.0 DnD fully committed.
- [x] Gesture arbitration per view (§4), pure libs (§5, all-day-aware `setWindow` + `formatDateValue`), edit hook deltas (§6), new parts (§7), keyboard (§8), cross-view/external (§9), F-03/F-04 (§10), all-day⇄timed round-trip + test matrix (§11), a11y (§12), deps + F-cross-13 gate (§13), file plan + 4-checkpoint sequence (§14).
- [x] **User sign-off (GATE 2)** — confirmed 2026-06-22 (cross-doc audit clean) → implementation (checkpoint 1) in progress.

After sign-off, changes to this doc are loud and intentional.

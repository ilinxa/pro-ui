# `calendar-01` v0.2.0 — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** 🟢 Approved (**GATE 1**, 2026-06-22) — recommendations re-validated + accepted: D22 snap `"15min"` · D20 parent-moves-alone (re-validated against gantt's group-move: gantt shifts leaves because it *ignores* a parent's own window; calendar *renders* parent windows → moves the parent) · D19 typed external boundary + demo tray · build order confirmed → proceed to GATE 2
> **Slug:** `calendar-01` · **Category:** `data` · **Tier:** pro-component (shadcn-style compound)
> **Bump:** v0.1.0 → **v0.2.0** (minor; **public-API-touching** → full GATE 1 → 2 → 3 per [`.claude/rules/readiness-review.md`](../../../.claude/rules/readiness-review.md))
> **Predecessors:** v0.1.0 [description](./calendar-01-procomp-description.md) (D1–D13) + [plan](./calendar-01-procomp-plan.md) (the §7 v2-editing seam). This doc records ONLY the deltas; everything not restated here is inherited from v0.1.0 unchanged.
> **Sibling precedent:** [`gantt-timeline-01` v0.2.0 description](../gantt-timeline-01-procomp/gantt-timeline-01-procomp-description-v0.2.0.md) — calendar's editing types were authored to mirror gantt's verbatim, so this is the **grid-edition of an already-shipped pattern**, not a green-field design.

This is the **what & why** of the **editing layer**. v0.1.0 shipped a read-only, four-view calendar whose state model was *deliberately architected for this* (v1 D2/D3: fully-controlled data, no internal data state, a complete-but-inert editing API already declared under the `Editing (v0.2.0)` fence in [`types.ts`](../../../src/registry/components/data/calendar-01/types.ts)). v0.2.0 makes it **editable** — direct event manipulation, task CRUD, quick-create, detail editing, keyboard, and cross-view drag — **additively, with zero rewrite of v1**, and closes the two open GATE 3 visual follow-ups (F-03/F-04).

---

## 0. Premise — the declared surface goes live

The entire v0.2.0 props surface **already exists** in [`types.ts`](../../../src/registry/components/data/calendar-01/types.ts) under the `══ Editing (v0.2.0) ══` fence — `editable`, `onChange`, `onTaskReschedule`, the five `todo-rich-card`-shaped CRUD/field events, the full `TodoPermissions` matrix + per-action predicates, `onPermissionDenied`, and the handle methods `addTask` / `deleteTask` / `editTask`. They are typed but **inert** (dispatchers are no-ops). v0.2.0 is therefore not "design an editor" — it is **"wire the declared dispatchers to real gestures + pure forest mutations,"** plus the few genuinely-new additions this doc introduces (the quick-composer config, the `snap` granularity, the cross-view DnD hooks).

The editing vocabulary is **already adopted, not invented**: calendar imports `TodoItem` / `TodoPermissions` / `TodoItemAddedEvent` / `TodoItemRemovedEvent` / `TodoItemMovedEvent` / `TodoFieldEditedEvent` / `TodoStatusChangedEvent` from `../todo-rich-card` (the same rewriter-safe relative-import pattern it already uses for `RAMPS` color — same module, depth-adjusted path). This is the **fourth consumer** of that vocabulary after card + tree + gantt — `evalCalendarPermission` will mirror `evalGanttPermission` / `todo-tree`'s `evalPermission`.

**Backward-compatibility is the hard constraint:** v0.2.0 must be a **no-behavior-change drop-in for v1 consumers**. Editing is **off by default** (`editable` defaults `false`); a consumer who doesn't opt in gets the byte-identical v1 read-only calendar. *(D14.)*

---

## 1. In scope / Out of scope (v0.2.0)

Per the GATE 1 scope confirmation (2026-06-22), v0.2.0 ships the **full editor (gantt parity)**, a **Google-style quick mini-composer** for create, and **all four** extra-feature tracks: F-03/F-04 visual polish, keyboard editing, quick status/priority change, and cross-view / external DnD.

### In scope — the edit surfaces

Gestures differ per view because the geometry differs (date grid vs time grid vs list). The vocabulary they write is identical.

**A. Direct manipulation — Month view (day granularity)**
- **Drag-to-reschedule** — drag an event chip / spanning bar from one date cell to another → shifts `startAt` (+ keeps the span: shifts `expireAt` / recomputes from `duration`) by whole days. Snaps to the day. Multi-day bars move rigidly.
- **Edge-resize (multi-day bars)** — drag the left / right end of a multi-day spanning bar to change start / end date (day granularity); clamp `end ≥ start`.

**B. Direct manipulation — Week / Day view (time granularity)**
- **Drag-to-reschedule** — drag a timed block vertically (change time-of-day) and, in Week, horizontally across day columns (change date). Snaps to the configurable minute increment (D22, default 15 min); **Alt** = free-drag for one gesture.
- **Edge-resize** — drag a block's top / bottom edge → top edits `startAt`, bottom edits `expireAt` (or `duration`). Clamp `end ≥ start` + a minimum visible duration.
- **All-day band** — drag an all-day item along the band to change its date(s); resize a multi-day all-day item's ends. (Folds in **F-03** — the band renders true column-spanning bars in this version.)
- **Live affordance** — ghost/preview + a date/time tooltip following the cursor; grab / row-resize cursors; bar-edge hit-tested ahead of bar-body ahead of empty-cell-create ahead of selection.

**C. Create**
- **Gestures:** (Month) click an empty cell, or drag across cells, to set an all-day / multi-day range; (Week/Day) drag a vertical range in an empty column to set a timed start→end, or click a slot for a default-duration event; (all-day band) drag a horizontal range.
- **UX — quick mini-composer (D16, the calendar-specific divergence from gantt).** The create gesture opens a **small popover** anchored at the gesture: a **title input**, a **time / all-day control** (prefilled from the gesture), and a **"More options"** link that expands to the full lazy `<TodoRichCard editable>`. `Enter` commits, `Esc` cancels. New item gets a fresh `id` (consumer may override in the handler). Fires `onItemAdded`.

**D. Delete · rename · detail**
- **Delete** — select + `Delete`/`Backspace`, a hover affordance on the event, and a context-menu entry. Fires `onItemRemoved`.
- **Inline rename** — double-click an event → inline title field; `Enter` commits, `Esc` cancels. Fires `onFieldEdited("name")`.
- **Detail editing (D17)** — open the **already-lazy `<TodoRichCard editable>`** (the v1 full-card tooltip lazy boundary, reused) in a popover for `status` / `targetPerson` / `priority` / `labels` / `description` / dates / color. The card emits its edited subtree; the calendar host splices it back into the forest. `permissions` thread straight into the embedded card.

**E. Quick status / priority (D18)**
- A **right-click context menu** (and the quick-composer's compact controls) flips `status` / `priority` / color over `statusOptions` / `priorityOptions` without opening the full card. Fires `onStatusChanged` / `onFieldEdited`.

**F. Cross-view / external DnD (D19)**
- **Cross-view (internal):** an event is a drag source in every view; drop targets are month cells, time-grid slots, and the all-day band. Drag an agenda row onto a month cell to reschedule it, etc. Internal cross-view reschedule writes the same `startAt`/`expireAt` events.
- **External drop-IN (consumer-wired):** the calendar **accepts** external drops via a typed hook (`onExternalDrop(date, allDay, dataTransfer)` — see §3); the component provides the drop targets + the typed callback, and **wiring the external source is the consumer's job** (we don't own foreign data shapes). **Export-OUT (dragging a calendar event out to another app) is CUT** (user 2026-06-22) — not in any version unless re-requested.

**G. Edit infrastructure**
- **Per-item permissions (D20)** — adopt `todo-rich-card`'s `TodoPermissions` (`default`/`byLevel`/`byItem`/`inherit`) + predicates (`canEditItem`/`canMoveItem`/`canResizeItem`/`canDeleteItem`/`canCreateChild`) + `onPermissionDenied`. `item.locked` blocks all edits. `evalCalendarPermission` maps calendar actions → `TodoPermissionRule` keys (`move`/`resize`→`drag`, `delete`→`remove`, `create`→`addChildren`, `editDetails`→`edit`), mirroring gantt + tree.
- **Keyboard editing (D21)** — on a selected event: arrows move by one snap unit (a day in Month, the minute increment in Week/Day; `Shift`+arrow resizes); `Delete`/`Backspace` deletes; `Enter` opens detail; `F2` inline-renames; on a focused empty cell, `Enter`/typing opens the quick-composer. Active only when an **event/cell** holds focus, never colliding with v1's `M`/`W`/`D`/`A` + period-step keys.
- **Validation** — `end ≥ start`, min-duration clamp, snap, permission + `locked` gates — all enforced **before** an event fires.
- **Controlled echo (D15)** — data stays controlled (v1 D3). Every edit fires its typed event **and** `onChange(next: TodoItem[])` carrying the whole mutated forest; the consumer echoes it into `data`. No internal uncontrolled-data mode.

### Also in scope — the open GATE 3 follow-ups

- **F-03** — Week/Day all-day band rendered as **column-spanning bars**, not per-day chips (needed for clean all-day drag/resize anyway).
- **F-04** — Month **"+N more"** overflow cap becomes **height-responsive** (derive the visible-event count from cell height) instead of the fixed `3`.

### Out of scope (deferred)

- **Marquee / multi-select + bulk move/delete** → **v2.1** (single-item direct manipulation this version; calendar D23, matching gantt's D21).
- **Built-in undo/redo** → consumer-owned by virtue of controlled data (gantt D19); recipe documented in the guide.
- **Editing recurrence rules** → recurrence display is v3 (v1 D13); editing a pre-expanded occurrence writes back to that occurrence's `TodoItem`, not a rule.
- **Auto-scheduling / conflict resolution / "find a time"** — non-goal (any version).

### Unchanged from v1

All read-only display + navigation (four views, period nav, view switch, mini-nav, lane-packing, now-line, urgency ramp, SSR-safe `now`, the three-layer all-day/timed/milestone classification), the compound structure, and the portability rules carry over verbatim.

---

## 2. Data contract — no new fields

v0.2.0 introduces **no new `TodoItem` fields.** Edits mutate existing fields only: `startAt` / `expireAt` / `duration` (reschedule, resize, create), `name` (rename), `children` (create / delete), and—via the embedded card—`status` / `targetPerson` / `priority` / `labels` / `description` / `borderColor`. Hierarchy stays **nested `children`** (no `parentId`); CRUD events carry `parentId` + `index` so the consumer can locate the splice point (the shape the card/tree/gantt already emit). The forest echo is `onChange(data: TodoItem[])`. **All-day vs timed is still purely derived** (the three-layer classifier) — an edit that drops a timed block onto the all-day band rewrites the item's `startAt`/`expireAt` to date-only ISO (and vice-versa), exactly the Google "all-day toggle" mechanism, **no `TodoItem` fork**.

---

## 3. API additions (the declared surface + the genuinely new bits)

The CRUD/field/permission props in §1 are **already in `CalendarProps`** (the inert fence). v0.2.0 makes them live and adds only:

```ts
// NEW props added to CalendarProps in v0.2.0 (everything else already declared):
snap?: "minute" | "5min" | "15min" | "30min" | "hour" | "day" | "off" | number; // default "15min"
quickCompose?: boolean;            // default true when editable — the mini-composer; false → create opens the full card directly
onExternalDrop?: (date: Date, allDay: boolean, data: DataTransfer) => void; // D19 external-drop hook
renderQuickComposer?: CalendarQuickComposerRenderer; // override the default mini-composer
```

**Imperative handle:** `addTask` / `deleteTask` / `editTask` are **already declared** (inert) — they go live. Possible additions (locked at GATE 2): `beginRename(id)`, `openQuickComposer(date)`.

**Compound additions (mountable parts — finalized at GATE 2):** `CalendarQuickComposer` (Tier-C, the mini-composer), `CalendarContextMenu` (Tier-B, right-click), and the edit dispatchers attach to the existing `Calendar01Root` — no new cross-cutting region beyond the composer + context menu. New internal modules anticipated: `lib/edit-mutations.ts` (pure forest ops, Vitest-ready) + `lib/edit-permissions.ts` (the resolver) + `hooks/use-calendar-edit.ts`. The detail-edit popover reuses the existing lazy `event-tooltip-full` boundary.

**New dependencies (re-arm F-cross-13 → makes the F-02 cross-backend smoke load-bearing):** shadcn `context-menu` + `input`; and—pending the GATE 2 DnD decision—`@dnd-kit/core` (the cross-view drag fit) **or** a native-pointer gesture layer like gantt's canvas (decided at GATE 2 — resolved to the **hybrid** in plan §3). `popover` / `tooltip` / `toggle-group` are already deps.

---

## 4. Decisions (continuing v1's D1–D13)

| # | Question | Recommendation (confirm at sign-off) |
|---|---|---|
| **D14** | **Edit enablement / backward-compat** | 🟢 Single `editable` master toggle, **default `false`** → byte-for-byte v1 behavior. Affordances capability-gated (handler present AND permission granted), like `todo-rich-card`. |
| **D15** | **Data ownership** | 🟢 **Controlled-only** (no uncontrolled `defaultData`) — the calendar is usually one tab sharing `data` with List/Board/Gantt; an internal copy would desync. Matches gantt D14. |
| **D16** | **Create UX** | 🟢 **Quick mini-composer** (Google-style: title + time/all-day + "More options" → full lazy card). *(User-chosen 2026-06-22.)* `quickCompose` defaults true; set false → create opens the full card directly (gantt's behavior). |
| **D17** | **Detail editing** | 🟢 **Reuse `<TodoRichCard editable>`** in a popover (the v1 full-card-tooltip lazy boundary already exists). No bespoke editor. Matches gantt D17. |
| **D18** | **Quick status/priority** | 🟢 **In v2** — right-click context menu + compact composer controls flip `status`/`priority`/color over the existing option lists. *(User-chosen.)* |
| **D19** | **Cross-view / external DnD** | 🟢 **Cross-view (internal) in v2** — every event a drag source, drop onto cells / slots / all-day band. **External** = the component provides typed drop targets + `onExternalDrop`; the consumer wires the foreign source. *(User-chosen; external boundary confirmed at §7 Q3.)* |
| **D20** | **Permissions + which events edit** | 🟢 Adopt `TodoPermissions` + predicates + `onPermissionDenied`; `locked` blocks all. **Parent items with children are editable** (it's an event, not a derived WBS summary — unlike gantt's summary bars); editing a parent moves the parent only, children keep their own dates. Milestones are draggable. |
| **D21** | **Keyboard editing** | 🟢 **In v2** — arrows move/resize a selected event by one snap unit; `Delete` deletes; `Enter` opens detail / the composer. Scoped to event/cell focus; no collision with v1 view/period keys. *(User-chosen.)* |
| **D22** | **Snapping** | 🟢 Time-grid snaps to a configurable minute increment via `snap` (**default `"15min"`**); Month snaps to the **day**; `"off"` / numeric override; **Alt** = free-drag for one gesture. (Calendar-specific — gantt snapped to its axis minor unit.) |
| **D23** | **Marquee / multi-select + bulk** | 🟢 **Defer to v2.1.** Single-item this version. Matches gantt D21. |
| **D24** | **Undo/redo** | 🟢 **Consumer-owned** (controlled data makes it free; guide ships a recipe). Matches gantt D19. |
| **D25** | **F-03 / F-04 fold-in** | 🟢 Ship the all-day spanning bars (F-03) + height-responsive month overflow (F-04) **in this version** — F-03 is a prerequisite for clean all-day drag/resize. |

---

## 5. Risks

- **Gesture arbitration per view.** Three distinct geometries (month date-grid, week/day time-grid, agenda list) each need their own hit-test precedence: edge-resize > body-move > empty-create > select, plus cross-view drag layered on top. The plan must specify per-view precedence + thresholds and keep the `editable=false` path byte-identical.
- **Snap × continuous-zoom-free but DST-laden time grid.** The time grid spans DST transitions (v1 already handles display); a drag/resize that crosses a DST boundary must write the correct wall-clock instant. Snap unit resolved at drag-start, not per-frame.
- **All-day ⇄ timed conversion.** Dropping a timed block on the all-day band (or vice-versa) rewrites `startAt`/`expireAt` between date-only and dateTime ISO — must round-trip through the **floating-local** parse path (v1's no-TZ-off-by-one rule), or it reintroduces the exact off-by-one GATE 1/2 caught in v1.
- **Forest mutation correctness.** Nested `children` (no `parentId`) means create/delete operate on the tree; the host needs a normalized `parentId`+`index` map. Occurrences are a *view* of items — an edit must write back to the source item, not the occurrence projection. Lane-packing + spanning-segment recomputation must re-run after every edit without a full remount.
- **Embedded-card round-trip.** The card edits a single subtree; splicing back must preserve sibling order + identity; permissions must pass through so the card never offers an edit the calendar would deny. (gantt's known caveat: card `duration` is whole-minutes — document.)
- **Cross-view / external DnD surface.** The heaviest item. `@dnd-kit` vs native pointer is a real fork (GATE 2). External drops touch foreign data — the typed boundary must be explicit so we don't own arbitrary `dataTransfer` shapes.
- **Backward-compat + cross-backend.** `editable=false` MUST be pixel/behavior-identical to v1. New `context-menu`/`input` (+ maybe `@dnd-kit`) re-open F-cross-13 — the Base UI consumer smoke (F-02, already owed) is now the ship gate.
- **A11y of editing.** Event focus + edit keys must not collide with toolbar/view keys; the quick-composer + rename field need focus management; permission-denied must announce, not silently no-op.

---

## 6. Success criteria (v0.2.0 ships when)

1. `editable=false` is a **verified** no-op vs v1 (visual + behavior + cross-backend smoke).
2. Drag-reschedule + edge-resize write correct `startAt`/`expireAt`/`duration` in **all three** editable views (month day-grid, week/day time-grid, all-day band), snap correctly, respect `end ≥ start` + min size, and round-trip all-day⇄timed through the floating-local path.
3. Create (per-view gestures) opens the quick mini-composer, commits via `onItemAdded`, and "More options" expands to the full lazy card.
4. Delete, inline rename, detail-edit, and quick status/priority all fire the correct `todo-rich-card`-shaped events **and** a coherent `onChange(forest)`.
5. Cross-view drag reschedules across views; `onExternalDrop` fires for external drops *into* the calendar. (Export-OUT cut.)
6. The `TodoPermissions` matrix + predicates + `locked` gate **every** edit path (keyboard, pointer, DnD, card); `onPermissionDenied` fires with a reason.
7. Keyboard editing works and doesn't collide with v1 keys; F-03 (all-day spanning bars) + F-04 (responsive overflow) closed.
8. Compound integrity holds — a hand-assembled subset still edits; the demo gains an "Editable" tab + an undo/redo recipe.
9. Gates: tsc/lint/meta-deps clean · `pnpm build` · **cross-backend consumer-tsc smoke CLEAN** (closes F-02) · live walkthrough of every edit gesture (closes F-01).

---

## 7. Open questions for sign-off (GATE 1)

1. **Snap default `"15min"`** for the time grid (Google's default) — OK, or prefer `"30min"`?
2. **D20 — parent items editable** (move the parent only, children keep their dates), unlike gantt's non-manipulable summary bars? (Recommend yes — a calendar event with sub-tasks is still one movable event.)
3. **D19 external boundary** — component provides drop targets + `onExternalDrop` (drop-**in** only; export-OUT cut 2026-06-22), consumer wires the foreign source. The "unscheduled tasks" tray ships in the **demo** as the reference; the component boundary stays typed-only.
4. **Build sequencing** — all of §1 ships as one v0.2.0, but I propose an internal build order with checkpoints: **(1)** month drag/resize/create + permissions + controlled echo → **(2)** week/day time-grid editing + all-day band (F-03) → **(3)** quick-composer + detail + context-menu + quick status → **(4)** keyboard + cross-view/external DnD + F-04. Any re-ordering, or anything to pull/push before I write the GATE 2 plan?

---

## 8. Definition of "done" for THIS document (stage gate)

- [x] Premise = the declared-but-inert surface goes live, additive over v1; backward-compat (D14) is the hard constraint.
- [x] Edit-surface inventory (§1) grounded in the **already-adopted** shared vocabulary (`TodoPermissions` + event types from `todo-rich-card`; 4th consumer after card/tree/gantt).
- [x] All four user-chosen scope tracks reflected: full editor, quick mini-composer (D16), F-03/F-04 (D25), keyboard (D21), quick status (D18), cross-view/external DnD (D19).
- [x] Data contract = no new fields (§2); controlled echo `onChange(TodoItem[])`; all-day⇄timed via floating-local.
- [x] API additions sketched (§3) — the declared surface + `snap`/`quickCompose`/`onExternalDrop`; new deps flagged (re-arm F-cross-13 smoke).
- [x] Decisions D14–D25 recorded with recommendations; 4 surfaced as open questions (§7).
- [x] **User sign-off (GATE 1)** — confirmed 2026-06-22 (recommendations re-validated + accepted) → `calendar-01-procomp-plan-v0.2.0.md` (GATE 2) now in progress.

After sign-off, changes to this doc are loud and intentional, not silent rewrites.

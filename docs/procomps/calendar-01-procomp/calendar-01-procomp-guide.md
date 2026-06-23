# `calendar-01` — Consumer Guide

> **Version:** v0.2.0 · **Status:** alpha
> **Slug:** `calendar-01` · **Category:** `data` · **Tier:** pro-component (shadcn-style compound)
> Install: `pnpm dlx shadcn@latest add @ilinxa/calendar-01` (base) or `@ilinxa/calendar-01-fixtures` (base + demo data).

The **date-grid** surface onto the canonical `TodoItem[]` — the discrete twin of [`gantt-timeline-01`](../gantt-timeline-01-procomp/). Month grid, week/day hour time-grids, and a day-grouped agenda, from the same task data your List / Board / Timeline tabs already render. **v0.2 adds an opt-in editing layer** (drag / resize / create / keyboard / copy-paste), additive over v0.1's read-only display.

---

## When to use

- You hold `TodoItem[]` (the data behind `todo-rich-card` / `todo-tree` / `kanban-board-01` / `gantt-timeline-01`) and want a **calendar tab** — month / week / day / agenda — with **no data adapter**.
- You need a real **hour-resolution week/day** view (lane-packed overlapping events, all-day band, now-line), not just a month grid.
- You want **in-place editing** (reschedule by drag/keyboard, resize, create, rename, detail-edit) and **cross-surface copy/paste** that moves tasks between the calendar and your other task views.
- You want a **mobile-friendly agenda** and a **desktop month grid** from one component.

## When NOT to use

- **You need a continuous, zoomable timeline with WBS roll-up** → that's `gantt-timeline-01` (the calendar deliberately has no summary rows; children are flattened).
- **You need a date *picker*** (single/range input) → use the shadcn `Calendar` primitive directly; calendar-01 uses it only for its optional jump-to-date mini-nav.
- **You want a read-only display** → just omit `editable` (default off). Note v0.2's read-only output differs from v0.1 in two intentional, opt-out-able ways — see *Gotchas → Upgrading from v0.1*.

---

## Composition patterns

**Read-only (Tier A):**
```tsx
<Calendar01
  data={tasks}
  statusOptions={statusOptions}
  defaultView="month"          // "month" | "week" | "day" | "agenda"
  now={serverNow}              // SSR-stable "now"
  showMiniNav
  onTaskClick={openDetail}
  onRangeChange={({ start, end }) => fetchWindow(start, end)}
/>
```

**Editable** (controlled-echo — edits come back via `onChange`; you own the data):
```tsx
const [tasks, setTasks] = useState<TodoItem[]>(initial);
<Calendar01
  editable
  data={tasks}
  onChange={setTasks}                    // every edit echoes the next forest
  statusOptions={statusOptions}
  priorityOptions={priorityOptions}
  permissions={permissions}              // shared TodoPermissions matrix (optional)
  statusColors={{ done: "...", blocked: "..." }}   // per-status accent (optional)
  flagPriority={(i) => i.priority === "high"}       // on-grid flag (optional)
  snap="15min"                           // keyboard/drag time granularity
  quickCompose                           // default true: create opens the mini-composer
  showInspector                          // a persistent details/edit panel beside the views
/>
```

**Controlled cursor** (drive view + date yourself):
```tsx
const [view, setView] = useState<CalendarView>("week");
const [date, setDate] = useState(new Date());
<Calendar01 data={tasks} view={view} onViewChange={setView} date={date} onDateChange={setDate} />
```

**Lighter, hand-assembled subset** (drops the week/day time-grid code from your bundle). To keep editing working when you hand-assemble, mount the edit overlays + composer yourself:
```tsx
<Calendar01Root editable data={tasks} onChange={setTasks} statusOptions={statusOptions} views={["month", "agenda"]}>
  <CalendarToolbar />
  <CalendarMonthView />
  <CalendarQuickComposer />
  <CalendarRenameField />
  <CalendarEventEditorOverlay />   {/* OR mount <CalendarEventInspector /> instead — not both */}
</Calendar01Root>
```

**Imperative handle:**
```tsx
const ref = useRef<CalendarHandle>(null);
ref.current?.goToToday();
ref.current?.setView("day");
ref.current?.next();                          // ref.current?.prev()
ref.current?.addTask(date, { name: "…" });    // editable-only (no-ops otherwise)
ref.current?.editTask(id); ref.current?.beginRename(id); ref.current?.deleteTask(id);
```

---

## Editing (v0.2)

All editing is **opt-in via `editable`** (default off → read-only), **gated** by the shared `TodoPermissions` matrix (+ optional `canMoveItem`/`canResizeItem`/`canDeleteItem`/`canCreateChild`/`canEditItem` predicates), and **controlled-echo**: there is no internal data copy — each edit fires a typed event (`onTaskReschedule` / `onItemAdded` / `onItemRemoved` / `onFieldEdited` / `onStatusChanged`) **and** `onChange(nextForest)`. One `onChange` per gesture = one undo step for you.

**Pointer:** drag an event to reschedule (whole days in month; time in week/day) · drag a bar/block edge to resize · drag across empty space (or double-click) to create · right-click for a menu (Edit / Rename / Status / Priority / **Copy** / **Cut** / Delete) · click selects (drives the inspector).

**Keyboard** (scoped to focus, so it never collides with the toolbar keys):
| Focus | Keys | Action |
|---|---|---|
| chrome | `M`/`W`/`D`/`A` · `←`/`→` · `T` | switch view · step period · today |
| event | `←`/`→` | move by one unit (day in month/agenda; `snap` in week/day) |
| event | `Shift`+`←`/`→` (+`↑`/`↓` in the time grid) | resize the end by one unit |
| event | `Delete`/`Backspace` · `Enter` · `F2` | delete · open detail editor · rename |
| empty day cell | `Enter` | open the quick-composer for that day |

**Copy / cut / paste — cross-surface.** With the calendar focused, `⌘/Ctrl+C` / `X` / `V` copy/cut/paste the focused (or selected) event. Tasks travel as a portable `ilinxa/task` envelope on the OS clipboard, so a task copied in the calendar **pastes into gantt / kanban / tree** (as those surfaces adopt the same envelope) and back. **The paste target decides all-day vs timed** — paste onto a month day → all-day; paste in the week/day grid → timed (this is also how you convert). Pasted items are re-id'd (no collisions). Copying foreign clipboard text is ignored (native paste proceeds).

**Detail editor & rename.** "Edit" (menu / `Enter`) opens the full `<TodoRichCard editable>`: **inline in `CalendarEventInspector`** when you mount it (`showInspector`), otherwise in a **centered modal overlay** (the assembly mounts `CalendarEventEditorOverlay` automatically when there's no inspector). `F2` / menu-Rename opens a small rename popup. The editor lazy-loads `todo-rich-card`, so a calendar that never opens it never bundles it.

---

## Gotchas

- **Upgrading from v0.1 — two intentional read-only-visible changes** (both opt-out-able):
  1. **Event color is now status-driven** (`colorBy` defaults to `"status"`, using `statusColors`/the status tone). v0.1 colored active events by a deadline-urgency ramp. **Set `colorBy="urgency"` to restore v0.1 exactly.**
  2. **Month overflow is now height-responsive** — the visible-event cap is derived from the cell height (a taller calendar shows more before "+N more"). **Set `maxEventsPerCell={3}` (or any number) to restore a fixed cap.** Unbounded-height calendars still cap ≈ 3.
- **In `editable` mode, `onDateClick` does not fire** for month day single-click — editing takes it over (double-click / `Enter` composes there).
- **All-day vs timed is *derived*, not stored.** `TodoItem` has no `allDay` flag. Order (first match wins): your `classifyEvent(item)` → a date-only string (`"2026-06-22"`, no `T`) ⇒ all-day, a full timestamp ⇒ timed → span heuristic (no end ⇒ milestone/all-day; ≥ 1 day ⇒ all-day; else timed).
- **Date-only strings are floating-local** (local midnight, not UTC) so all-day events never render a day early; the all-day⇄timed round-trip (drag/paste) preserves the calendar date with no off-by-one.
- **All-day end is exclusive** (iCal/Google): `"2026-06-20" → "2026-06-22"` covers Jun 20–21. Keyboard/drag resize honor this.
- **Pass `now` for SSR.** Without it the now-line/urgency seed to epoch on the server and resolve to the real clock one frame after mount (no hydration mismatch).
- **Children are flattened — no roll-up.** Every dated item (and descendant) renders as its own event. Roll-up summaries are gantt's job.
- **Copy/paste needs the calendar to hold focus** and is skipped while you're typing in an input (so the composer/rename/editor keep native text copy/paste).
- **Modal overlays are not focus-trapped** (Tab can leave the dialog) — consistent with gantt's editor; a `<dialog>` migration is a tracked follow-up.

---

## Migration notes

New greenfield component (no predecessor). The fifth member of the task-management set; shares the `TodoItem` + `TodoStatusOption` + `TodoPermissions` vocabulary with the rest — moving data between card / tree / board / gantt / calendar needs no transformation. The cross-surface clipboard helpers (`serializeTasks` / `parseTasks` / `reassignTaskIds` / `TaskClipboardEnvelope`) are exported from the calendar barrel and are slated to hoist into `todo-rich-card` (the shared vocabulary) so every task surface reads the same envelope.

---

## Open follow-ups (v0.2.x)

- **F-01 (live visual walkthrough)** — verified by build + SSR + 3-pass code review; the in-browser walkthrough (drag/resize/keyboard/copy-paste, overlays, F-04 responsive cap) is owed post-deploy.
- **F-02 (cross-backend smoke)** — v0.2 adds the `context-menu` + `input` primitives (atop v0.1's `toggle-group`/`popover`/`tooltip`/`calendar`); a post-deploy consumer-tsc smoke (Radix + Base UI) is expected, with a possible patch (the 4-ship pattern).
- **Modal focus-trap** — `aria-modal` overlays don't trap Tab yet (native `<dialog>` migration, with gantt, in a later bump).
- **Hoist the clipboard** into `todo-rich-card` + wire gantt / kanban / tree (the "between all task tools" epic).
- **Live-preview perf** — the resize preview rebuilds the whole context per pointermove (isolate to a preview-only context).
- **Grid roving-tabindex** arrow-key cell navigation (editable cells are individual tab stops today).
- **Deferred/reserved:** external HTML5 drop tray (`onExternalDrop` is declared but inert — copy/paste replaces it), agenda-row dragging, bespoke conversion-drag, time-grid empty-slot keyboard create.

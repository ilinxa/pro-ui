# `calendar-01` — Consumer Guide (Stage 3)

> **Stage:** 3 of 3 · **Version:** v0.1.0 · **Status:** alpha
> **Slug:** `calendar-01` · **Category:** `data` · **Tier:** pro-component (shadcn-style compound)
> Install: `pnpm dlx shadcn@latest add @ilinxa/calendar-01` (base) or `@ilinxa/calendar-01-fixtures` (base + demo data).

The read-only **date-grid** surface onto the canonical `TodoItem[]` — the discrete twin of [`gantt-timeline-01`](../gantt-timeline-01-procomp/). Month grid, week/day hour time-grids, and a day-grouped agenda, from the same task data your List / Board / Timeline tabs already render.

---

## When to use

- You hold `TodoItem[]` (the data behind `todo-rich-card` / `todo-tree` / `kanban-board-01` / `gantt-timeline-01`) and want a **calendar tab** — month / week / day / agenda — with **no data adapter**.
- You need a real **hour-resolution week/day** view (lane-packed overlapping events, all-day band, now-line), not just a month grid.
- You want a **mobile-friendly agenda** and a **desktop month grid** from one component.

## When NOT to use

- **You need a continuous, zoomable timeline with WBS roll-up** → that's `gantt-timeline-01` (the calendar deliberately has no summary rows; children are flattened).
- **You need editing today** → v1 is read-only. Drag-to-reschedule / create / detail-edit land in **v0.2** (the API is already declared, so upgrading is additive).
- **You need a date *picker*** (single/range input) → use the shadcn `Calendar` primitive directly; calendar-01 uses it only for its optional jump-to-date mini-nav.

---

## Composition patterns

**Batteries-included (Tier A):**
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

**Controlled cursor** (drive view + date yourself):
```tsx
const [view, setView] = useState<CalendarView>("week");
const [date, setDate] = useState(new Date());
<Calendar01 data={tasks} view={view} onViewChange={setView} date={date} onDateChange={setDate} />
```

**Lighter, hand-assembled subset** (drops the week/day time-grid code from your bundle):
```tsx
<Calendar01Root data={tasks} statusOptions={statusOptions} views={["month", "agenda"]}>
  <CalendarToolbar />
  {/* render the one view you want, or your own switcher */}
  <CalendarMonthView />
</Calendar01Root>
```

**Rich hover card** (lazy-loads `todo-rich-card`):
```tsx
<Calendar01 data={tasks} renderTooltip={(item) => <CalendarFullCardTooltip item={item} statusOptions={statusOptions} />} />
```

**Imperative handle:**
```tsx
const ref = useRef<CalendarHandle>(null);
ref.current?.goToToday();
ref.current?.setView("day");
ref.current?.next();           // ref.current?.prev()
ref.current?.getVisibleRange();
```

---

## Gotchas

- **All-day vs timed is *derived*, not stored.** `TodoItem` has no `allDay` flag. Resolution order (first match wins):
  1. your `classifyEvent(item)` predicate (return `"all-day" | "timed" | "milestone"`, or `undefined` to defer);
  2. a **date-only string** (`"2026-06-22"`, no `T`) ⇒ all-day; a full timestamp ⇒ timed;
  3. span heuristic — no end ⇒ milestone (or all-day if the start is date-only); span ≥ 1 day ⇒ all-day; else timed.
- **Date-only strings are floating-local.** `"2026-06-22"` is parsed as local midnight (not UTC) so all-day events never render a day early. Full timestamps go through `Date.parse` (matching the rest of the family).
- **All-day end is exclusive** (iCal / Google semantics): `"2026-06-20" → "2026-06-22"` covers Jun 20–21 (two days). Use the day *after* the last covered day as `expireAt`.
- **Pass `now` for SSR.** Without it the now-line/urgency seed to epoch on the server and resolve to the real clock one frame after mount (a brief settle, no hydration mismatch). With `now`, first paint is exact.
- **Children are flattened — no roll-up.** Every dated item (and descendant) renders as its own event. A parent with its own dates renders alongside its children. Roll-up summaries are gantt's job.
- **Default tooltip is a native `title`.** It's instant, accessible, and pulls no primitive. Pass `renderTooltip` for a rich card (that path lazy-loads `todo-rich-card`).
- **Month overflow caps at 3 chips/day** (override with `maxEventsPerCell`); the rest collapse into "+N more" (a popover, or your `onShowMore`).
- **Week/Day grids scroll** to `scrollToHour` (default 8) on mount; they show 24h.

---

## Migration notes

New greenfield component (no predecessor). It is the fifth member of the task-management set and shares the `TodoItem` + `TodoStatusOption` + `TodoPermissions` vocabulary with the rest — moving data between the card / tree / board / gantt / calendar needs no transformation.

---

## Open follow-ups (v0.1.x / v0.2)

- **F-01 (live visual walkthrough)** — v0.1.0 was verified by build + SSR + code-path reasoning; the in-browser walkthrough (month lane layout, time-grid positioning, mini-nav, tooltip) is owed post-deploy.
- **Cross-backend smoke** — calendar-01 introduces `toggle-group` / `popover` / `tooltip` / `calendar` primitives; a post-deploy consumer-tsc smoke (Radix + Base UI) is expected, with a likely v0.1.1 patch (the 4-ship pattern).
- **Week/Day all-day band** shows all-day events as per-day chips; column-**spanning** bars in the band are a v0.1.x refinement (the month grid already spans).
- **Month overflow** is a fixed cap (3); height-responsive counting is a v0.1.x refinement.
- **Grid roving-tabindex** arrow-key cell navigation (v1 has period/view shortcuts + focusable event buttons).
- **v0.2 — editing:** drag-to-reschedule, edge-resize, create-on-cell, detail popover (lazy `<TodoRichCard editable>`), context menu, delete, and the shared `TodoPermissions` matrix — all behind `editable` (the props are already declared, inert in v1).

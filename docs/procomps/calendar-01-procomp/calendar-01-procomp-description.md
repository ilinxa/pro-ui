# `calendar-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** 🟡 Draft — awaiting sign-off (→ GATE 2)
> **Slug:** `calendar-01` · **Category:** `data` · **Tier:** pro-component (ships as a **shadcn-style compound** — see §0)
> **Conceptual lineage:** Calendar surfaces (Google Calendar, Outlook, Notion Calendar, Cron/Notion, Apple Calendar, FullCalendar, react-big-calendar) + task-planner calendars (Linear, Height, Motion, Sunsama).
> **The fifth and final member of the project-management set** — sibling of [`todo-rich-card`](../../../src/registry/components/data/todo-rich-card/) (list), [`todo-tree`](../../../src/registry/components/data/todo-tree/) (outline), [`kanban-board-01`](../../../src/registry/components/data/kanban-board-01/) (board), and [`gantt-timeline-01`](../../../src/registry/components/data/gantt-timeline-01/) (continuous-axis timeline). It does **not** extend or embed any of them — it is a fresh, standalone procomp that consumes the **same canonical `TodoItem[]`** and lays the items out on a **calendar date grid** (month cells / week & day time-grids / agenda list) instead of cards, columns, an outline, or a continuous time axis. *Same data genes, different surface.* This is the **date-grid sibling** the gantt description ([§"Deliberate non-goals"](../gantt-timeline-01-procomp/gantt-timeline-01-procomp-description.md)) explicitly reserved: "Date-grid layout (month/week/day cells, agenda) is the planned sibling `calendar-01` (next procomp)."

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, give a precise inventory of the data it visualizes + the states it must cover, surface the open design decisions, and earn sign-off before any planning or code.

> 🎯 **Read-me-first.** §4 is the **exact data structure** every event is drawn from (the canonical `TodoItem`, the same one verified against [`todo-rich-card/types.ts`](../../../src/registry/components/data/todo-rich-card/types.ts) that gantt consumes). §10 is the **coverage checklist** — every view, state, and edge case to produce. The component is **read-only in v1** (no drag/resize/create) — a *display* surface, not an editor — but its state model is architected so v2 drag-to-reschedule and create-on-cell drop in without a rewrite (§7-D2/D3), reusing the editing vocabulary `gantt-timeline-01` already proved.

---

## 0. Compound-structure declaration (mandated)

`calendar-01` trips **multiple** triggers in [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md): it has ≫ 3 distinct mountable regions (toolbar / month grid / week grid / day grid / agenda list / mini-nav), it composes another procomp (`todo-rich-card`, optionally lazy-embedded in the hover/detail slot), and a reasonable consumer would want only a subset — "just the month view", "month + agenda, no time-grids", "the agenda list on mobile." The week/day **time-grid** logic (hour positioning + overlap lane-packing) plus the lazy `todo-rich-card` tooltip are real weight a month-only consumer shouldn't be forced to pull. **Therefore it ships as a shadcn-style compound** — headless `Root` provider + flat à-la-carte parts + standalone primitives + one logic-free assembly. Flat exports, never a `Name.Root` namespace.

**Rough part inventory** (precise tier split + final names locked at GATE 2):

| Tier | Members (rough) | Role |
|---|---|---|
| **B — headless Root** | `Calendar01Root` | Owns data normalization (`TodoItem[]` → calendar **occurrences** with effective start/end + all-day/timed/milestone classification), the **cursor** (current `view` + `focusDate` → derived visible range), selection state, the `now`-tick + color engine, the imperative handle, and the context. Renders `children`. |
| **B — context parts** (flat) | `CalendarToolbar` · `CalendarMonthView` · `CalendarWeekView` · `CalendarDayView` · `CalendarAgendaView` · `CalendarMiniNav` | One module per region; each reads `useCalendar()` — no prop-drilling. The four views are **independent modules** so dropping three of them drops their code. |
| **C — standalone primitives** (context-free) | `CalendarEventChip` · `CalendarEventBar` (multi-day span segment) · `CalendarTimeBlock` (positioned timed block) · `MonthDayCell` · `TimeGrid` / `TimeGutter` · `NowIndicator` · `AgendaRow` · `EventTooltip` (lightweight default; full-card path is the lazy `renderTooltip`) | Dumb, prop-driven; usable anywhere. |
| **A — assembly** | `Calendar01` | `Root` + toolbar + (optional) mini-nav + the active view, gated by `show*` toggles. Contains no logic the parts don't. Demo + screenshot use this. |

**Tree-shaking story:** each view is its own module re-exported from the barrel. The **week/day time-grid** logic (hour positioning + overlap lane-packing) lives only in the `CalendarWeekView` / `CalendarDayView` modules — a month-only consumer never pulls it. The **full-card tooltip path** (`renderTooltip` → `todo-rich-card`) is `React.lazy` so a consumer who keeps the default lightweight `EventTooltip` never pulls `todo-rich-card` into their graph. A month-only, agenda-only, or grid-only subset must fall out for free. (Tier A pulls all four views — that is expected; the subset story is for hand-assembled layouts.)

---

## 1. Problem

Every planning product eventually needs the **"when, on the calendar?"** view — the canonical month grid everyone reaches for, plus the hour-resolution week/day grids for dense days and the linear agenda for mobile / scan-reading. Cards, outlines, boards, and even the gantt's continuous axis don't answer *"what's on Tuesday the 14th?"* the way a date grid does:

- sprint / cycle planning — what lands this week, by day
- content / publication schedules — what publishes on which date; embargo → sunset spanning multiple days
- personal task planning — week-at-a-glance and a packed single day, hour by hour
- team availability / shift views — who's on what day
- agent / pipeline run calendars — scheduled runs per day, dense days expanded to hours

**We already carry the data for this.** The canonical `TodoItem` — the JSON that drives `todo-rich-card`, nests in `todo-tree`, bridges into `kanban-board-01`, and lays out as bars in `gantt-timeline-01` — ships `setAt` / `startAt` / `expireAt` / `duration`, a consumer-defined `status`, `priority`, `labels`, people, and `children`. What's missing is the **primitive that buckets those items into calendar cells** — a calendar that:

1. classifies each item as **all-day / multi-day**, **timed**, or **milestone** from its effective start/end (§7-D5),
2. renders the right shape per view: **chips + multi-day spanning bars** in the month grid, **positioned, lane-packed time blocks** in the week/day hour grids, **chronological rows** in the agenda,
3. paints **urgency + status** using the **same color engine** as `todo-rich-card` and `gantt-timeline-01` (imported, not re-implemented),
4. and consumes **`TodoItem[]` directly** — so a product's "Calendar" tab is literally the same task data its List / Board / Timeline tabs show, on a fifth surface.

Today every product hand-rolls month/week/day grids (the classic "we'll just use FullCalendar" → 2-4 weeks of theming + data-adapter glue + accessibility usually skipped). This procomp is that primitive, native to the `TodoItem` model and the design system.

### Release strategy — phased

| Version | Scope |
|---|---|
| **v1 (this doc)** | **Read-only**, four views: **Month** (date cells with chips + multi-day spanning bars + "+N more" overflow), **Week** + **Day** (hour time-grids: all-day band + positioned, lane-packed timed blocks + now-line), **Agenda** (chronological list grouped by day). Period navigation (prev/next/today), view switching, jump-to-date mini-nav, hover tooltip, selection, keyboard nav. Status/urgency color from the shared engine. Consumes `TodoItem[]`. Standalone-usable. **State model architected for editing (§7-D2/D3) — write callbacks reserved, not shipped.** |
| **v2** | Interaction: **drag-to-reschedule** (drag a chip/bar to another day; drag a time block to another hour/day), **edge-resize** the span, **create-on-cell-click**, **detail popover** (lazy `<TodoRichCard editable>`), context menu, delete. Reuses `gantt-timeline-01`'s `edit-mutations` mental model + an `evalCalendarPermission` mirroring `evalGanttPermission`. Controlled-echo events (no internal data state). |
| **v3** | Recurrence **display** (consumer still expands to occurrences; calendar reads an optional pre-expanded set), multi-calendar / resource lanes (color-keyed overlapping calendars), density heatmap (year/multi-month overview). |
| **v4** | Cross-timezone scheduling, export (ICS / print), working-hours shading + business-day constraints. |

Each step is independently shippable; v1 alone is a registerable, data-faithful display.

---

## 2. In scope / Out of scope

### v1 — in scope

**Views (all four ship in v1)**

- **Month** — a 7-column weekday grid of full-week rows covering the focus month (leading/trailing days from adjacent months shown muted, like every real calendar). Each **day cell** stacks the day's events:
  - **multi-day** events render as **horizontal spanning bars** across the week row (continuing into the next week row as a fresh segment, with continuation affordances at the row edges) — the Google/Notion convention;
  - **single-day / timed** events render as **compact chips** (time + truncated name);
  - cell overflow → a **"+N more"** affordance (click → popover listing that day's events, §7-D9).
- **Week** — a **time-grid**: 7 day columns × hour rows (default 24h, scrollable; configurable day-window). A top **all-day band** holds multi-day + all-day events as spanning bars; **timed** events are positioned vertically by effective start→end and **lane-packed** side-by-side when they overlap (§7-D8). A horizontal **now-line** crosses the current day's column.
- **Day** — the same time-grid as Week, single column. All-day band + hour rows + now-line. The high-resolution single-day view.
- **Agenda** — a linear, chronological list **grouped by day** (day header → that day's events as rows with time + name + status badge + assignee). Scannable, mobile-first, and the natural empty-state-friendly view. Honors a `range` (e.g. next 30 days).

**Event geometry & classification** (§7-D5 locks the rule)

- **Effective start** = `startAt ?? setAt`; **effective end** = `expireAt ?? (effectiveStart + duration)`.
- **Milestone** — neither `expireAt` nor `duration`: a zero-length point. Rendered as a **dot/diamond marker** at its time (chip with a leading dot in month; a thin marker in the time-grid).
- **Multi-day / all-day** — the effective span covers ≥ 1 full day boundary (or is explicitly all-day per the D5 convention): rendered as a **spanning bar** (month week-row / week+day all-day band).
- **Timed** — start and end within a single calendar day with a sub-day window: rendered as a **chip** in month and a **positioned block** in week/day.
- **Overdue** — effective end in the past and status tone not `done`: red treatment (consistent with gantt).
- **Inactive** (`active: false`) — dimmed (~50% opacity, still selectable).

**Color** — reuse the shared engine (consistency is a hard requirement)

- Event fill/accent comes from the item's **status tone** via consumer-supplied `statusOptions`: `active` tones use the **time-urgency ramp** (fresh → red as the window elapses), `done` → muted/gray, `blocked` → red. The ramp is **imported from `todo-rich-card`** (its `RAMPS` runtime presets + the `TodoColorRamp` type) exactly as `gantt-timeline-01`'s `lib/color.ts` does (`import { RAMPS } from "../../todo-rich-card"`) — not re-derived.
- Per-item `borderColor` override is honored (skips the engine for that event), same as the card and gantt.

**Navigation (read-only)**

- **Period navigation** — prev / next / **Today** (toolbar buttons + keyboard `PageUp`/`PageDown` step the period, `T` jumps to today). The unit follows the active view (month ± 1 month, week ± 1 week, day ± 1 day, agenda ± its range).
- **View switching** — a Month / Week / Day / Agenda toggle in the toolbar (toggle-group), plus `M`/`W`/`D`/`A` keyboard shortcuts.
- **Jump-to-date mini-nav** — an optional sidebar **mini month** (built on the shadcn `calendar` / react-day-picker primitive, §7-D7) for fast date jumps. This is the **only** place the shadcn date-picker is used; the main grids are bespoke.
- **Scroll** — week/day time-grids scroll vertically (with an initial scroll to working hours / now); the month grid is fixed-height-per-week.
- **Keyboard cell navigation** — arrow keys move a focus ring across days (month) / across day columns + hour slots (week/day); `Enter` fires `onTaskClick` on the focused event; roving-tabindex grid semantics.
- Read-only: navigation moves the cursor/viewport only; it never mutates `TodoItem` data. (Drag-to-*reschedule* is the v2 feature — §7-D2.)

**Read-only interactions**

- **Hover** an event → **lightweight tooltip** (name + dates/time + assignee + status) by default; a `renderTooltip` slot overrides it (and may lazy-embed the full `<TodoRichCard>`) — §7-D6.
- **Click** an event → selection highlight + `onTaskClick(item)` (consumer wires what opens).
- **Click** a day number / empty cell → `onDateClick(date)` (consumer can switch view or, in v2, open create).
- **"+N more"** → `onShowMore(date, items)` or the built-in day-popover.

**Empty / loading / boundary states**

- Empty (`data: []`), loading (skeleton grid + skeleton toolbar), single event, a day with dozens of events (overflow + lane-pack stress), all-milestone data, all-multi-day data, events entirely outside the visible period (agenda gracefully empty; grids show "nothing this period"), DST-boundary days (§7-D11), week spanning a month boundary.

**Portability**

- Zero `next/*` imports; no `process.env`; no app context. Registry-import rules: only `react`, `@/components/ui/*`, `@/lib/utils`, the declared third-party deps (`date-fns`, optionally `react-day-picker` via the shadcn `calendar` primitive), and same-category relative imports of `todo-rich-card`. SSR-safe: the "now"-line + today highlight + urgency color compute from a `now` prop on first paint, then a client interval refreshes — the same contract as the card's `colorRefreshIntervalMs` and gantt's now-tick.

### v1 — out of scope (deferred)

- **Drag-to-reschedule, edge-resize, create-on-cell, detail popover, context menu, delete** → v2 (read-only v1, §7-D2 — but the data contract + state model are built to absorb it, and gantt's editing vocabulary is the template).
- **Recurrence (RRULE)** → consumer expands to fresh `TodoItem`s in v1; native pre-expanded recurrence display is v3.
- **Multi-calendar / resource lanes, density heatmap, year view** → v3.
- **Cross-timezone scheduling** → v4 (v1 renders ISO timestamps in a single display timezone, §7-D11).
- **Export (ICS / PNG / print), working-hours shading, business-day constraints** → v4.

### Deliberate non-goals (any version)

- **Not a continuous-axis timeline.** The pan/zoom Gantt bar chart with WBS summary rows is `gantt-timeline-01`. This component is a **discrete date grid**. They are deliberate twins, not competitors.
- **Not a task editor.** It renders `TodoItem`s; field editing is `todo-rich-card`'s job (v2 borrows its editable card in a popover).
- **Not a scheduling engine.** No auto-scheduling, conflict resolution, availability solving, or constraint satisfaction.
- **Not a server-state synchroniser.** Consumer wires data + persistence (controlled-echo, like the rest of the family).

---

## 3. Target consumers

- **Product teams** adding a "Calendar" tab beside their existing List / Board / Timeline tabs — already holding `TodoItem[]`, want a fifth surface with zero data reshaping.
- **PM / planning tools** needing the month-grid default plus a real hour-resolution week/day for busy days.
- **Content / editorial tools** scheduling posts across days (multi-day embargo → publish windows as spanning bars).
- **Personal-productivity / dashboard builders** wanting an agenda on mobile and a month grid on desktop from one component.
- **Internal-ops dashboards** (agent run calendars, shift views) — read-only display of dated records that already match the `TodoItem` shape.

The shared thread: **anyone already on the `TodoItem` model** who needs the calendar surface. The component must look native to the design system out of the box and require no data adapter.

---

## 4. The data it renders — the canonical `TodoItem`

`calendar-01` consumes the **same `TodoItem[]`** as the rest of the family. It does **not** define its own event type; it imports `TodoItem` (+ option/permission/event types) from `todo-rich-card` via the proven same-category relative import + barrel re-export pattern (§7-D4) — exactly as `gantt-timeline-01` does. The authoritative definition is [`todo-rich-card/types.ts`](../../../src/registry/components/data/todo-rich-card/types.ts) (≈ lines 43–75); the fields this component reads:

| Field | Type | How calendar-01 uses it |
|---|---|---|
| `id` | `string` | occurrence identity, selection, event keys |
| `name` | `string` | event label (chip / bar / block / agenda row) |
| `setAt` | `string` (ISO, **required**) | fallback effective start when `startAt` absent |
| `startAt?` | `string` (ISO) | **effective start** (preferred) — which cell / hour the event begins |
| `expireAt?` | `string` (ISO) | **effective end** (preferred) — drives span + overdue |
| `duration?` | `number` (ms) | effective end when `expireAt` absent (lossy on v2 edit round-trips, same caveat as gantt) |
| `status` | `string` (**required**) | color tone via `statusOptions`; agenda badge |
| `active` | `boolean` (**required**) | inactive → dimmed |
| `priority?` | `string` | optional indicator / future filter |
| `labels?` | `string[]` | optional dots / future filter |
| `targetPerson?` | `TodoPerson` | optional assignee avatar on event + agenda row |
| `borderColor?` | `string` (CSS) | per-event color override (skips the engine) |
| `locked?` | `boolean` | (v2) hard-blocks all edits, like the rest of the family |
| `children?` | `TodoItem[]` | **flattened** to occurrences in v1 (every item with a date renders, regardless of nesting depth). Calendar has **no WBS summary rows** — that's gantt's surface. See §7-D10. |

**Classification is derived, not stored — resolved at §7-D5.** The `TodoItem` model has **no explicit `allDay` flag**. The calendar classifies each event all-day / timed / milestone via a **three-layer rule** (consumer `classifyEvent?` predicate → date-only-string detection à la Google → span-based heuristic fallback), **without forking the shared type**. See §7-D5 for the full rule, including the floating-local-date parsing requirement that avoids a timezone off-by-one.

`statusOptions` / `priorityOptions` / `labelOptions` / `colorRamp` are passed in by the consumer exactly as for the card, tree, and gantt — same prop names, same shapes.

---

## 5. Rough API sketch

> Illustrative only — full prop types, the compound export surface, and the imperative handle are locked at GATE 2. Names mirror `gantt-timeline-01` for cross-component muscle memory.

```tsx
// Tier A — batteries-included assembly
<Calendar01
  data={items}                       // TodoItem[]  (controlled; no internal data state)
  statusOptions={statusOptions}      // shared with card / tree / gantt
  priorityOptions={priorityOptions}
  labelOptions={labelOptions}
  colorRamp={colorRamp}              // urgency ramp, imported engine

  defaultView="month"                // "month" | "week" | "day" | "agenda"
  defaultDate={new Date()}           // initial focus date (the cursor anchor)
  weekStartsOn={1}                   // 0=Sun … 6=Sat (default Monday, §7-D12)
  now={serverNow}                    // SSR-stable now; client interval refreshes
  agendaRangeDays={30}               // agenda window

  showToolbar
  showMiniNav={false}                // sidebar jump-to-date (shadcn calendar primitive)

  onTaskClick={(item) => openDetail(item)}
  onDateClick={(date) => {/* v2: open create */}}
  onViewChange={(view) => {}}
  onRangeChange={({ view, start, end }) => fetchWindow(start, end)}  // lazy data loading
  onShowMore={(date, items) => {}}

  classifyEvent={(item) => item.labels?.includes("holiday") ? "all-day" : undefined}  // optional override (§7-D5); else date-only string → all-day, else span heuristic
  renderTooltip={(item) => <TodoRichCard data={item} />}            // lazy; default is lightweight
/>

// Tier B/C — hand-assembled "lighter" subset (month + agenda only; no time-grids pulled)
<Calendar01Root data={items} statusOptions={statusOptions} defaultView="month">
  <CalendarToolbar views={["month", "agenda"]} />
  <CalendarMonthView />
</Calendar01Root>
```

**Reserved-but-not-shipped in v1** (architected, fire in v2): `editable`, `permissions: TodoPermissions`, `onChange(next: TodoItem[])`, `onTaskReschedule`, `onItemAdded`/`onItemRemoved`/`onItemMoved`/`onFieldEdited`/`onStatusChanged` — the **identical controlled-echo vocabulary** `gantt-timeline-01` ships, so v2 is additive, not a re-API.

**Imperative handle (rough):** `goToDate(date)` · `goToToday()` · `setView(view)` · `next()` / `prev()` · `getVisibleRange()`.

---

## 6. Example usages

**6.1 — The fifth tab (drop-in beside List / Board / Timeline)**
```tsx
<Tabs>
  <TabPanel value="list">     <TodoRichCardList data={items} /></TabPanel>
  <TabPanel value="board">    <KanbanBoard01 ... /></TabPanel>
  <TabPanel value="timeline"> <GanttTimeline01 data={items} statusOptions={s} /></TabPanel>
  <TabPanel value="calendar"> <Calendar01 data={items} statusOptions={s} /></TabPanel>
</Tabs>
```
Same `items`, same `statusOptions` — the calendar needs no adapter.

**6.2 — Content schedule (multi-day spanning bars)**
A publication tool feeds posts whose `startAt` = embargo and `expireAt` = sunset. The month view shows each as a spanning bar across its active days; the agenda lists publish dates chronologically for the editorial standup.

**6.3 — Packed personal day (hour-resolution time-grid)**
A planning app defaults `defaultView="day"`; timed tasks lane-pack side-by-side when they overlap, the all-day band carries the multi-day commitments, and the now-line tracks the current time — the dense single-day view the month grid can't give.

**6.4 — Mobile agenda + lazy windowed fetch**
On small screens the consumer forces `defaultView="agenda"` and uses `onRangeChange` to fetch only the visible window from the server, re-feeding `data` (controlled).

---

## 7. Open design decisions

Locked decisions carry a ✅. Where a decision reserves an aspect for a later version, that's stated inline.

- **D1 — Four views in v1.** ✅ Month + Week + Day + Agenda all ship in v1 (per sign-off). The week/day time-grids are the heaviest pieces; they live in their own modules so a month/agenda-only consumer doesn't pay for them.
- **D2 — Read-only v1, editing v2.** ✅ v1 is a display surface; all write callbacks + `editable`/`permissions` are reserved (§5) and fire in v2, reusing gantt's vocabulary verbatim so v2 is additive.
- **D3 — Cursor state model.** ✅ The Root owns a `{ view, focusDate }` **cursor** + `selectedId`; the visible range derives from the cursor (pure, in `lib/date-range.ts`). **No internal data state** — fully controlled, like the rest of the family. This is the seam v2 editing writes through.
- **D4 — Cross-procomp reuse.** ✅ Import `TodoItem` + option/permission/event types from `../todo-rich-card` (same-category relative barrel import) and **re-export** them from `calendar-01/types.ts`, exactly as gantt does — single-import consumer DX, rewriter-safe. Color ramp imported from todo-rich-card; no re-implementation.
- **D5 — All-day vs timed classification.** ✅ **Resolved** (was the headline open question; validated against the family's date handling — `gantt-timeline-01/lib/geometry.ts` parses effective start/end with native `Date.parse`). `TodoItem` has no `allDay` flag, so the calendar classifies every event with a **three-layer rule, first match wins**:
  1. **Consumer predicate** — an optional `classifyEvent?(item): "all-day" | "timed" | "milestone" | undefined` prop wins when it returns a kind (`undefined` defers to the next layer). This is the explicit escape hatch; it is a **pure function prop** (the family's render-prop idiom), **not** a flag bolted onto the shared `TodoItem` — the shared type stays untouched, and a consumer can encode any backend convention ("items labelled `holiday` are all-day").
  2. **Date-only strings (Google's own mechanism)** — a `startAt`/`expireAt` that is a bare calendar date (`YYYY-MM-DD`, no `T`) marks an **all-day** event; a full timestamp (`…T…`) is a timed candidate. Detection is trivial (absence of `T`). ⚠️ **Implementation rule:** date-only values MUST be parsed as a **floating local calendar date** (split Y-M-D → build a local `Date`), **not** raw `Date.parse` — which per spec reads `"2026-06-22"` as **UTC midnight** and would render all-day events a day early in negative-UTC offsets. Google treats all-day events as timezone-independent; we mirror that.
  3. **Default heuristic (last resort)** — when every value is a full timestamp and no predicate is given: **milestone** if neither `expireAt` nor `duration`; **all-day/multi-day** if the effective span covers ≥ 1 full calendar day (or is an exact 24h multiple); **timed** otherwise. The earlier "starts exactly at midnight ⇒ all-day" clause is **dropped** — it is timezone-fragile and would misread genuine midnight-timed tasks; layer 2 carries the unambiguous all-day signal instead.

  **Cross-component caveat:** gantt/card parse the same date-only string as UTC midnight (`Date.parse`), so a consumer mixing an all-day date-only item across gantt + calendar may see a 1-day visual offset *in gantt* under some timezones — acceptable (all-day is a calendar-only concept; gantt just draws a short bar) and called out in the guide. **All date parsing in the calendar carries finite-date guards** (mirroring gantt's v0.3.1 **G2** fix — no `new Date(NaN).toISOString()` throws; an unparseable date renders label-only, never crashes).
- **D6 — Month event rendering = chips + spanning bars.** ✅ Single-day/timed → chips; multi-day → spanning bars across week rows (segmented per row with continuation caps); overflow → "+N more". The real-calendar convention; not negotiable for credibility.
- **D7 — Mini-nav uses the shadcn `calendar` primitive.** ✅ The sidebar jump-to-date month is the shadcn `calendar.tsx` (react-day-picker); the main month/week/day grids are **bespoke** (react-day-picker is a date *picker*, not an event grid). Mini-nav is opt-in (`showMiniNav`, default off).
- **D8 — Time-grid overlap = lane-packing.** ✅ Overlapping timed events in week/day split into side-by-side lanes (the standard interval-graph greedy column assignment), in a pure `lib/lane-pack.ts`. Defer "show overlap as stacked with +N" alternative.
- **D9 — Month overflow.** ✅ Cap visible chips per cell by available height; surplus → "+N more" → built-in day-list popover (overridable via `onShowMore`).
- **D10 — Children are flattened, no WBS.** ✅ Every dated item renders regardless of nesting depth; the calendar has no summary/rollup rows (that's gantt's surface). A parent with its own dates renders as its own event alongside its children.
- **D11 — SSR + timezone.** ✅ `now` prop for SSR-stable first paint + client interval (family contract). v1 renders ISO timestamps in a **single display timezone** (the runtime's); cross-tz is v4. DST days handled by `date-fns` interval math (hour rows may be 23/25 on transition days — rendered honestly).
- **D12 — Week start.** ✅ `weekStartsOn` prop (0–6); **default Monday**. No implicit locale-derivation in v1 (keeps the default SSR-stable, per Q2); a locale-aware default is a future opt-in, not a v1 behavior.
- **D13 — Recurrence.** ✅ Out of scope v1 — consumer pre-expands to `TodoItem` occurrences. Native pre-expanded display is v3.

---

## 8. Success criteria

The component is "done" (v1) when:

1. **Data-faithful** — any valid `TodoItem[]` renders correctly across all four views with no adapter; milestone / multi-day / timed / overdue / inactive all visually distinct and correct.
2. **All four views ship** and switch instantly; period nav + jump-to-date + view toggle all work via mouse **and** keyboard.
3. **Time-grids are real** — week/day position timed events by actual time, lane-pack overlaps, show an all-day band + now-line, and scroll sanely (initial scroll to working hours/now).
4. **Color is shared** — identical tone/urgency output to `todo-rich-card` and `gantt-timeline-01` for the same item (imported engine, verified).
5. **Compound + tree-shakeable** — flat exports; a hand-assembled month-only subset renders and does **not** pull the week/day time-grid code or `todo-rich-card`; demo includes a "lighter / composed" example.
6. **Accessible** — roving-tabindex grid semantics, `aria` for events + cells, focus-visible, screen-reader-sensible event labels (name + date/time + status).
7. **Portable** — zero `next/*`; only the allowed imports; SSR-safe; installs cleanly via the registry and passes consumer-side `tsc`.
8. **All gates green** — tsc, lint, `validate:meta-deps`, `pnpm build`, `registry:build`; GATE 3 spotcheck ≥ "Pass with follow-ups".

---

## 9. Open questions

- **Q1 — all-day vs timed detection.** ✅ **RESOLVED** (was the headline open question; re-validated against source — see §7-D5). Three-layer rule: consumer `classifyEvent?` predicate → date-only-string detection (Google's mechanism, parsed as a **floating local date** to avoid a TZ off-by-one) → span-based heuristic fallback. **No fork of the shared `TodoItem`**; robust whether the consumer's data carries date-only values or is all-timestamps (so the "what does your data look like?" question is no longer blocking).
- **Q2 — locale-aware week start (future).** v1 locks `weekStartsOn` (explicit prop, **default Monday**, no implicit locale magic — §7-D12, SSR-stable). Genuinely open only as a *future* opt-in: should a later version derive the default from `Intl`/locale when the prop is omitted? Deferred — not a v1 concern.
- **Q3 — agenda window semantics.** Fixed `agendaRangeDays` from focus date, or "infinite scroll forward with lazy `onRangeChange`"? Lean: fixed window v1, infinite-scroll reserved.
- **Q4 — month cell overflow policy.** Fixed N chips, or height-responsive count? Lean: height-responsive with a `maxEventsPerCell` override.
- **Q5 — day-window for time-grids.** Always 00:00–24:00, or a configurable visible-hours window (e.g. 6:00–22:00 with collapse for off-hours)? Lean: full 24h scrollable v1 with initial scroll to working hours; configurable window reserved.
- **Q6 — does v1 want any filtering/legend** (by status/label/person), or is that strictly the consumer's chrome? Lean: none built-in v1 (consumer filters `data`); a `CalendarLegend` Tier-C primitive *maybe*, decided at GATE 2.

---

## 10. Coverage checklist (every cell to produce)

**Views**
- [ ] Month grid — full weeks, leading/trailing muted days, today highlight, week-start respected
- [ ] Week time-grid — 7 columns, hour rows, all-day band, now-line, vertical scroll
- [ ] Day time-grid — single column, all-day band, hour rows, now-line
- [ ] Agenda — day-grouped chronological list over a range

**Event shapes**
- [ ] Chip (single-day / timed) · Spanning bar (multi-day, segmented per week row + continuation caps) · Time block (positioned + lane-packed) · Milestone marker (dot/diamond) · Agenda row

**States**
- [ ] Overdue · Inactive (dimmed) · Selected · Hovered (tooltip) · Focused (keyboard ring) · `borderColor` override

**Color**
- [ ] Status tone · urgency ramp (active) · done (muted) · blocked (red) — output matches card + gantt

**Navigation**
- [ ] Prev/next/today (per-view unit) · view switch (mouse + keyboard) · mini-nav jump · grid keyboard nav · `onRangeChange` on every cursor move

**Classification (§7-D5)**
- [ ] `classifyEvent` predicate override · date-only string → all-day (parsed as **floating local date**, no TZ off-by-one) · all-timestamp data via span heuristic · unparseable date → finite-guard (label-only, no throw)

**Edge / boundary**
- [ ] Empty · loading skeleton · single event · overflow-heavy day · all-milestone · all-multi-day · out-of-period · DST-transition day · month-boundary week · long names (truncation + tooltip) · RTL · mobile (agenda-first)

**Portability / a11y**
- [ ] Zero `next/*` · allowed imports only · SSR-safe `now` · roving-tabindex grid · aria for cells + events · focus-visible

---

> **Next gate:** on sign-off, this advances to **GATE 2 — the plan** (`calendar-01-procomp-plan.md`): final API + compound export surface (three tiers) + file-by-file plan + the `lib/` math modules (`date-range` / `occurrences` / `lane-pack` / `color` / `classify`) + dependencies + the v2-editing seam + accessibility contract + the remaining open questions (Q3–Q6; Q1 + Q2 already settled above) resolved. **No `pnpm new:component` until the plan is signed off.**

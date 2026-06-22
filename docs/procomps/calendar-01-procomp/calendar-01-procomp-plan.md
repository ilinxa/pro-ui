# `calendar-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Draft — awaiting sign-off (→ implementation)
> **Slug:** `calendar-01` · **Category:** `data` · **Tier:** pro-component (shadcn-style **compound**)
> **Description (GATE 1, signed off):** [`calendar-01-procomp-description.md`](./calendar-01-procomp-description.md)
> **Reference impl mirrored throughout:** [`gantt-timeline-01`](../../../src/registry/components/data/gantt-timeline-01/) — the family's most recent date-driven compound. calendar-01 reuses its data model, controlled-echo vocabulary, cross-procomp import pattern, and folder shape.

This is the **plan** doc (the "how") — the implementation contract. It locks the final API, the three-tier compound export surface, the file-by-file build, the pure `lib/` math modules, dependencies, the v2-editing seam, edge-case handling, and the accessibility contract. **No `pnpm new:component` until this is signed off.**

---

## 0. Resolved open questions (Q3–Q6 from the description)

| # | Question | **Decision** |
|---|---|---|
| Q3 | Agenda window semantics | **Fixed window**: `agendaRangeDays` (default 30) forward from the focus date. Infinite-scroll-forward reserved (would layer on `onRangeChange` + virtualization). |
| Q4 | Month cell overflow | **Height-responsive** chip count (measured per cell), with a `maxEventsPerCell?` hard override. Surplus → **"+N more"** → built-in `Popover` day-list (overridable via `onShowMore`). |
| Q5 | Time-grid day window | **Full 00:00–24:00, scrollable**, with an **initial scroll** to working hours (`scrollToHour`, default 8) or the now-line if today is visible. A collapsible off-hours / configurable visible window is **reserved** (would be `dayStartHour`/`dayEndHour`). |
| Q6 | Built-in filtering / legend | **None in v1.** The consumer filters `data` and renders their own legend/filters (the family convention — calendar stays a render surface). No `CalendarLegend` primitive ships in v1. |

(Q1 — all-day/timed classification — and Q2 — week start — were resolved in the description: §7-D5 three-layer rule and §7-D12 `weekStartsOn` default Monday.)

---

## 1. Final API

All public types live in `types.ts` and are re-exported from the barrel. Prop **names + shapes mirror `gantt-timeline-01`** wherever the concern is shared (data, selection, tooltip, the entire v2 editing block) so a consumer who knows the gantt knows the calendar.

### 1.1 New calendar enums + the occurrence type

```ts
export type CalendarView = "month" | "week" | "day" | "agenda";

/** How an event is laid out. Derived (never stored on TodoItem) — see §4.3. */
export type EventKind = "all-day" | "timed" | "milestone";

/** Normalized, render-ready event — the output of lib/occurrences.ts. Internal-ish
 *  (exported for advanced Tier-C use, like gantt's GanttRow/GanttBarGeometry). */
export type CalendarOccurrence = {
  item: TodoItem;          // the source item (calendar never mutates it)
  id: string;              // = item.id
  kind: EventKind;
  startMs: number;         // effective start, epoch ms (floating-local for date-only all-day)
  endMs: number;           // effective end, epoch ms (= startMs for milestone)
  allDay: boolean;         // kind !== "timed"
  color: CalendarEventColor;  // resolved via lib/color.ts (shared engine)
  overdue: boolean;        // endMs < now && status tone !== "done"
  inactive: boolean;       // item.active === false
  invalid?: boolean;       // unparseable date → finite-guard; rendered label-only, no geometry (§4.2)
};

export type CalendarEventColor = { fill: string; foreground: string; border?: string };
export type CalendarTooltipRenderer = (item: TodoItem, occ: CalendarOccurrence) => ReactNode;
```

### 1.2 Assembly props (`CalendarProps`)

```ts
export type CalendarProps = {
  // ── Data (identical surface to gantt / card / tree) ──
  data: TodoItem[];                          // controlled; NO internal data state
  statusOptions?: TodoStatusOption[];
  priorityOptions?: TodoPriorityOption[];
  labelOptions?: TodoLabelOption[];
  colorRamp?: TodoColorRamp;                 // urgency ramp; RAMPS imported from todo-rich-card

  // ── Cursor: view + focus date (each controlled OR uncontrolled) ──
  defaultView?: CalendarView;                // default "month"
  view?: CalendarView;                       // controlled
  onViewChange?: (view: CalendarView) => void;
  defaultDate?: Date;                        // default = now
  date?: Date;                               // controlled focus date
  onDateChange?: (date: Date) => void;
  /** Fires on every cursor move with the newly-visible window (lazy data fetch). */
  onRangeChange?: (range: { view: CalendarView; start: Date; end: Date }) => void;

  // ── Calendar config ──
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // default 1 (Mon) — §7-D12
  now?: Date | string;                       // SSR-stable now; client interval refreshes
  colorRefreshIntervalMs?: number;           // urgency tick; default 60_000 (family contract)
  agendaRangeDays?: number;                  // default 30 — Q3
  maxEventsPerCell?: number;                 // month overflow cap; default = height-responsive — Q4
  scrollToHour?: number;                     // time-grid initial scroll; default 8 — Q5
  classifyEvent?: (item: TodoItem) => EventKind | undefined;  // §4.3 layer 1

  // ── Assembly toggles + layout ──
  showToolbar?: boolean;                     // default true (assembly only)
  showMiniNav?: boolean;                     // default false (assembly only) — §7-D7
  className?: string;
  "aria-label"?: string;

  // ── Read-only interactions ──
  selectedId?: string | null;
  onSelect?: (itemId: string | null) => void;
  onTaskClick?: (item: TodoItem) => void;
  onDateClick?: (date: Date) => void;        // day-number / empty-cell click
  onShowMore?: (date: Date, items: TodoItem[]) => void;
  renderTooltip?: CalendarTooltipRenderer;   // default = lightweight EventTooltip; lazy full card

  // ══ Editing (v0.2.0) — ALL opt-in; default surface is the v1 read-only calendar ══
  /** Master switch. Default false → byte-identical v1 read-only behavior. */
  editable?: boolean;
  /** Full mutated forest after ANY edit; controlled consumer echoes into `data`. */
  onChange?: (data: TodoItem[]) => void;
  /** Reschedule sugar — fires alongside onChange/onFieldEdited (kept from gantt). */
  onTaskReschedule?: (next: { itemId: string; startAt: string; expireAt?: string }) => void;
  // CRUD + field events (shapes reused verbatim from todo-rich-card)
  onItemAdded?: (event: TodoItemAddedEvent) => void;
  onItemRemoved?: (event: TodoItemRemovedEvent) => void;
  onItemMoved?: (event: TodoItemMovedEvent) => void;
  onFieldEdited?: (event: TodoFieldEditedEvent) => void;
  onStatusChanged?: (event: TodoStatusChangedEvent) => void;
  // Permissions (reused from todo-rich-card; mirrors gantt + tree)
  permissions?: TodoPermissions;
  canMoveItem?: (id: string) => boolean;
  canResizeItem?: (id: string) => boolean;
  canDeleteItem?: (id: string) => boolean;
  canCreateChild?: (id: string) => boolean;
  canEditItem?: (id: string) => boolean;
  onPermissionDenied?: (action: keyof TodoPermissionRule, itemId: string, reason: TodoPermissionReason) => void;
};
```

> **v1 ships everything above the `══ Editing ══` fence.** The editing block is declared in the type (so v2 is purely additive, no re-API — the exact lesson gantt v0.1.0→v0.2.0 proved) but is **inert** in v1: the implementation ignores it and the demo never sets `editable`. This matches gantt's `types.ts:168` fence verbatim.

### 1.3 Headless Root props + imperative handle

```ts
/** Headless provider props = assembly props minus the assembly-only toggles. */
export type CalendarRootProps = Omit<CalendarProps, "showToolbar" | "showMiniNav"> & {
  children: ReactNode;
};

export type CalendarHandle = {
  goToDate(date: Date): void;
  goToToday(): void;
  setView(view: CalendarView): void;
  next(): void;                              // period forward (view-relative)
  prev(): void;                              // period back
  getVisibleRange(): { start: Date; end: Date };
  // Editing (v0.2.0) — no-ops when `editable` is false / permission denied.
  addTask(date: Date, item?: Partial<TodoItem>): void;
  deleteTask(itemId: string): void;
  editTask(itemId: string): void;
};
```

---

## 2. Compound export surface (the mandated three tiers)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md). **Flat exports, never a `Calendar.Root` namespace.** `index.ts` mirrors gantt's ordering:

```ts
// Assembly (Tier A)
export { Calendar01 } from "./calendar-01";

// Headless provider + context parts (Tier B) — flat exports, never a namespace
export { Calendar01Root } from "./parts/calendar-root";
export { CalendarToolbar } from "./parts/calendar-toolbar";
export { CalendarMonthView } from "./parts/calendar-month-view";
export { CalendarWeekView } from "./parts/calendar-week-view";
export { CalendarDayView } from "./parts/calendar-day-view";
export { CalendarAgendaView } from "./parts/calendar-agenda-view";
export { CalendarMiniNav } from "./parts/calendar-mini-nav";

// Standalone primitives (Tier C)
export {
  CalendarEventChip,
  CalendarEventBar,
  CalendarTimeBlock,
  NowIndicator,
  EventTooltip,
} from "./parts/calendar-event";
export { MonthDayCell } from "./parts/calendar-month-view";
export { TimeGrid, TimeGutter } from "./parts/calendar-time-grid";
export { AgendaRow } from "./parts/calendar-agenda-view";
export { CalendarSkeleton } from "./parts/calendar-skeleton";
export { CalendarFullCardTooltip } from "./parts/event-tooltip-full";  // lazy todo-rich-card

// Hook
export { useCalendar } from "./hooks/use-calendar-context";

// Public types (+ the consumed todo-rich-card data language, re-exported)
export type {
  CalendarProps, CalendarRootProps, CalendarHandle,
  CalendarView, EventKind, CalendarOccurrence, CalendarEventColor, CalendarTooltipRenderer,
  TodoItem, TodoPerson, TodoStatusOption, TodoPriorityOption, TodoLabelOption,
  TodoColorRamp, TodoPermissions, TodoPermissionRule, TodoPermissionReason,
  TodoItemAddedEvent, TodoItemRemovedEvent, TodoItemMovedEvent,
  TodoFieldEditedEvent, TodoStatusChangedEvent,
} from "./types";
```

> **Re-export note:** calendar-01 additionally re-exports `TodoPermissionReason` (its `onPermissionDenied` signature references it). gantt's barrel happens to omit that one type — this is a deliberate, slightly-more-complete choice, not a mirror error. `TodoPermissionReason` is exported by `todo-rich-card`'s barrel, so the re-export is valid. The set + ordering otherwise follow gantt.

**Tier map**

| Tier | Exports | Notes |
|---|---|---|
| **A** — assembly | `Calendar01` | `Calendar01Root` + `CalendarToolbar` (if `showToolbar`) + optional `CalendarMiniNav` (if `showMiniNav`) + the active view. **No logic the parts lack.** |
| **B** — headless Root | `Calendar01Root` | Owns ALL state (cursor, selection, occurrences memo, now-tick) + context + handle. Renders `children`. |
| **B** — context views/parts | `CalendarToolbar` · `CalendarMonthView` · `CalendarWeekView` · `CalendarDayView` · `CalendarAgendaView` · `CalendarMiniNav` | Each reads `useCalendar()`. The four views are **independent modules**. |
| **C** — standalone primitives | `CalendarEventChip` · `CalendarEventBar` · `CalendarTimeBlock` · `MonthDayCell` · `TimeGrid` · `TimeGutter` · `NowIndicator` · `AgendaRow` · `EventTooltip` · `CalendarSkeleton` · `CalendarFullCardTooltip` | Dumb, prop-driven, context-free. |

**Tree-shaking contract (verified at GATE 3):**
- Each view is its own module. The **week + day time-grid** logic (hour positioning + lane-packing) lives in `parts/calendar-time-grid.tsx` + the two view wrappers — a consumer importing only `CalendarMonthView` never pulls it.
- `CalendarFullCardTooltip` (→ `todo-rich-card`) is loaded via `React.lazy` from inside the Root *only when* a consumer passes a `renderTooltip` that needs it; the default `EventTooltip` is lightweight and pulls nothing. A consumer on the default tooltip never bundles `todo-rich-card`.
- Tier A pulls all four views (expected — batteries-included). The subset story is for hand-assembled layouts; the demo includes a **"Lighter (month + agenda)"** tab proving it (compound-rule GATE-3 requirement).

---

## 3. File-by-file plan (sealed folder — mirrors gantt + `data-table` shape)

```
src/registry/components/data/calendar-01/
├── calendar-01.tsx            Tier A. <Calendar01> = Root + Toolbar + (MiniNav) + active view via show* toggles. forwardRef → CalendarHandle.
├── types.ts                   All public + internal types (§1). Imports TodoItem & friends from "../todo-rich-card"; re-exports them (D4).
├── index.ts                   Barrel (§2).
├── meta.ts                    ComponentMeta (§5 deps). version 0.1.0, status alpha, category data.
├── demo.tsx                   Tabs: Month · Week · Day · Agenda · "Lighter (month+agenda)" · Mini-nav. Uses dummy-data. (docs-only)
├── usage.tsx                  Copy-paste snippets per view + the hand-assembled subset. (docs-only)
├── dummy-data.ts              TodoItem[] fixtures: timed, multi-day spanning, milestone, overdue, inactive, a dense day, an all-day (date-only) item, deep-nested children.
├── parts/
│   ├── calendar-root.tsx          Tier B Root. Resolves cursor (use-calendar-cursor) + selection; memoizes occurrences (lib/occurrences) keyed on data/now/classify; now-tick (use-now-tick); builds context; exposes handle; fires onRangeChange on cursor change. Holds the lazy renderTooltip boundary.
│   ├── calendar-toolbar.tsx       Tier B. Period label + prev/next/Today + ToggleGroup view switch (+ keyboard handled in Root). Capability-gated: a `views` prop trims the switch (used by the "lighter" subset).
│   ├── calendar-month-view.tsx    Tier B CalendarMonthView + Tier C MonthDayCell. Renders monthGrid weeks; per week row computes spanning-bar segments (lib/segments) + per-day chip stacks + "+N more" Popover.
│   ├── calendar-time-grid.tsx     Tier C TimeGrid + TimeGutter (shared by week+day). Hour rows, all-day band, scroll container, NowIndicator. Takes columns (Date[]) + packed occurrences.
│   ├── calendar-week-view.tsx     Tier B CalendarWeekView. Thin: reads context, builds 7 day columns, lane-packs (lib/lane-pack), renders <TimeGrid>.
│   ├── calendar-day-view.tsx      Tier B CalendarDayView. Same as week with a single column. (Imports the shared time-grid module — week+day share weight.)
│   ├── calendar-agenda-view.tsx   Tier B CalendarAgendaView + Tier C AgendaRow. Day-grouped chronological list over agendaRangeDays.
│   ├── calendar-mini-nav.tsx      Tier B CalendarMiniNav. Wraps shadcn <Calendar> (react-day-picker); selecting a day calls goToDate. (D7)
│   ├── calendar-event.tsx         Tier C primitives: CalendarEventChip, CalendarEventBar, CalendarTimeBlock, NowIndicator, EventTooltip. Dumb, prop-driven; color + label + selection/focus state via props.
│   ├── event-tooltip-full.tsx     Tier C CalendarFullCardTooltip — lazy-embeds <TodoRichCard>. Loaded via React.lazy.
│   └── calendar-skeleton.tsx      Tier C CalendarSkeleton — per-view skeleton (grid / time-grid / list).
├── hooks/
│   ├── use-calendar-context.ts    useCalendar() — reads context (throws if outside Root).
│   ├── use-calendar-cursor.ts     Controlled/uncontrolled {view, date} resolution + next/prev/goToDate/setView; derives visibleRange (lib/date-range).
│   └── use-now-tick.ts            SSR-safe now: seed from `now` prop, then setInterval(colorRefreshIntervalMs) post-mount. (mirrors gantt use-color-tick)
└── lib/
    ├── date-range.ts              Pure (date-fns). visibleRange(view,date,weekStartsOn,agendaRangeDays); monthGrid → Date[][]; weekColumns → Date[]; dayHours → Date[].
    ├── occurrences.ts             Pure. toOccurrences(data,{now,classifyEvent,statusOptions,colorRamp}) → CalendarOccurrence[]. Flattens children; effective start/end + finite guards; classify; color (lib/color).
    ├── classify.ts                Pure. classify(item,classifyEvent?) → EventKind (3-layer §4.3); parseDateValue(s) → {ms, dateOnly} (date-only detect + floating-local + finite guard).
    ├── segments.ts                Pure. weekSegments(occs, weekDays) → spanning-bar rows (multi-day split per week) + per-day chip lists + overflow counts (month).
    ├── lane-pack.ts               Pure. packLanes(timedOccs) → {occ, lane, laneCount}[] (greedy interval-graph column assignment, week/day).
    └── color.ts                   Reuse. import { RAMPS } from "../../todo-rich-card"; resolve fill/fg/border from status tone + urgency ramp + borderColor override. Mirrors gantt lib/color.ts.
```

**Scaffolding caveat:** `pnpm new:component` emits only the **7 top-level files** (`calendar-01.tsx` / `types.ts` / `index.ts` / `meta.ts` / `demo.tsx` / `usage.tsx` / `dummy-data.ts`). **`parts/`, `hooks/`, and `lib/` are created by hand** (§11 step 1) — the template has no subfolders. (`_template/_template` must stay valid TS — don't break it.)

---

## 4. The `lib/` math modules (the heart — all pure, framework-free, Vitest-ready)

### 4.1 `date-range.ts`
- `visibleRange(view, focusDate, weekStartsOn, agendaRangeDays): { start: Date; end: Date }` — month → `startOfWeek(startOfMonth)`…`endOfWeek(endOfMonth)`; week → the `weekStartsOn` week; day → that day; agenda → `[focusDate, focusDate + agendaRangeDays)`.
- `monthGrid(focusDate, weekStartsOn): Date[][]` — full weeks (always whole weeks; 5 or 6 rows) via `eachDayOfInterval`.
- `weekColumns(focusDate, weekStartsOn): Date[]` (7) · `dayHours(): number[]` (0–23).
- All via **date-fns** (`startOfMonth`/`endOfMonth`/`startOfWeek`/`endOfWeek`/`eachDayOfInterval`/`add*`/`isSameDay`/`isSameMonth`). DST-correct by construction (date-fns handles 23/25-hour days).

### 4.2 `occurrences.ts`
- `toOccurrences(data, ctx)` — depth-first flatten of `children` (every dated item becomes one occurrence; **no rollup** — D10); compute `startMs`/`endMs` via `classify.parseDateValue` + the effective rules; `endMs = startMs` for milestone; `overdue`/`inactive`; `color` via `color.ts`. **Finite guards** throughout: an unparseable date → the occurrence is flagged `invalid` and rendered label-only (never a NaN geometry / `toISOString` throw — gantt v0.3.1 G2 lesson).

### 4.3 `classify.ts` — the §7-D5 three-layer rule (locked)
1. `classifyEvent?.(item)` → if it returns a kind, use it.
2. **Date-only detection** — `parseDateValue(startAt)`/`parseDateValue(expireAt)`: a value matching `/^\d{4}-\d{2}-\d{2}$/` (no `T`) is **all-day**, parsed as a **floating local date** (`new Date(y, m-1, d)` — NOT `Date.parse`, which is UTC-midnight and off-by-one in negative offsets).
3. **Span heuristic** — milestone if no `expireAt`/`duration`; all-day if span ≥ 1 full calendar day (or exact 24h multiple); else timed.

### 4.4 `segments.ts` (month)
- For each week row: split each multi-day occurrence into a **segment** clipped to `[weekStart, weekEnd]`, assign a stable vertical **lane** (stack order) so the same event holds the same row across the week, mark continuation (`◀`/`▶`) when clipped; single-day/timed → day chips; compute per-day overflow against `maxEventsPerCell` (or the measured height) → "+N more".

### 4.5 `lane-pack.ts` (week/day)
- Classic greedy interval-graph column assignment: sort timed occurrences by start, place each in the first lane whose last event ended ≤ its start, widen `laneCount` per cluster. Output drives `left%`/`width%` of each `CalendarTimeBlock`.

### 4.6 `color.ts`
- `import { RAMPS } from "../../todo-rich-card"` — the runtime `Record<preset, (t: number) => string>` ramp functions (defined in todo-rich-card's `lib/ramp.ts`, re-exported by its barrel) + the `TodoColorRamp` type (via the local `../types` barrel). Resolve `{fill, foreground, border}` from status tone (`statusOptions`) → done=muted / blocked=red / active=urgency-ramp(elapsed) — **identical output to gantt + card** (Success-criterion 4). `item.borderColor` overrides (skips the engine).

---

## 5. Dependencies

**shadcn primitives** (registry deps) — `pnpm dlx shadcn@latest add` any missing:
- `button`, `toggle-group` (view switch), `popover` ("+N more" day-list + tooltip surface), `tooltip` (hover), `calendar` (mini-nav → react-day-picker, transitive), `avatar` (assignee), `badge` (status), `skeleton`, `separator`.
- v0.2 only: `context-menu`, `input` (NOT added in v1).

**npm:** `date-fns` (`^4.1.0`, already present) · `lucide-react` (icons). *No direct `react-day-picker`* — it arrives via the shadcn `calendar` primitive. *No `@tanstack/react-virtual` in v1* (month/week/day are bounded; agenda is a fixed 30-day window — virtualization reserved for the infinite-agenda follow-up). *No `@dnd-kit/*` in v1* (v0.2 editing).

**internal:** `todo-rich-card` (types + `RAMPS` + the lazy full-card tooltip).

> ⚠️ **Known smoke risk (flagged now).** calendar-01 introduces shadcn primitives the gantt didn't use — `toggle-group`, `popover`, `tooltip`, `calendar`. That re-arms the **F-cross-13 / cross-backend (Radix vs Base UI) divergence** class. Expect the **4-ship pattern** (ship → post-deploy cross-backend consumer-tsc smoke → patch → re-smoke) and a likely **v0.1.1** smoke follow-up, exactly as engagement-bar-01's Popover sub-trap and the news-card's dropdown did. Defensive primitive usage (no `asChild` gymnastics; render triggers directly) is the build-time mitigation; the smoke is the proof. `meta.ts` deps must list every primitive actually imported (`validate:meta-deps` gate).

---

## 6. Composition pattern

Headless **Root provider + context parts + standalone primitives** (compound). The Root owns the **cursor** (`{view, date}`, controlled-or-uncontrolled via `use-calendar-cursor`), `selectedId`, the memoized `occurrences`, and the `now`-tick; parts read `useCalendar()` (no prop-drilling). Classification is a **render-prop escape hatch** (`classifyEvent`); the tooltip is a **lazy slot** (`renderTooltip` → `CalendarFullCardTooltip`). **Fully controlled data** — `onChange` (v2) echoes; no internal data state (family invariant, D3). Capability-gating: omit `onTaskClick`/`onDateClick`/`onShowMore` → those affordances no-op silently; in v2, omit edit handlers / fail a permission → the edit affordance hides (gantt's pattern).

---

## 7. Client vs server

**`"use client"`** — required: cursor + selection state, scroll refs (time-grid initial scroll + now-line), the `now` interval, pointer handlers (v2), and `React.lazy`. **SSR-safe first paint:** today highlight + now-line + urgency color seed from the `now` prop (no `Date.now()` at module/render top-level); the client interval refreshes post-mount. Zero `next/*`, no `process.env`, no app context (portability gate).

---

## 8. Edge cases (from the description §10 coverage checklist)

- **Empty** (`data: []`) → per-view empty state ("No events this period"). **Loading** → `CalendarSkeleton` (grid / time-grid / list variant).
- **Single event · all-milestone · all-multi-day · dense day** (overflow + lane-pack stress).
- **Out-of-period** → agenda shows nothing gracefully; grids show the empty period.
- **DST-transition day** → 23/25 hour rows rendered honestly (date-fns).
- **Month-boundary week** → leading/trailing muted days; spanning bars clip + continuation caps.
- **Date-only all-day** → floating-local parse (no off-by-one). **Unparseable date** → finite-guard, label-only, no throw.
- **Long names** → truncate + tooltip. **RTL** → grid + time-grid mirror (logical props / `dir`-aware). **Mobile** → agenda-first; toolbar collapses; time-grid horizontally scrolls if needed.

---

## 9. Accessibility

- **Month** = `role="grid"`, weeks as `role="row"`, days as `role="gridcell"`; **roving tabindex** across days (arrows), `PageUp`/`PageDown` = prev/next month, `Home`/`End` = week ends, `T` = today; events inside a cell are `<button>`s reachable via Enter-into-cell then Tab/arrow (documented model). `aria-selected` on the focused day.
- **Week/Day time-grid** — columns labeled by date; timed events are `<button>`s with `aria-label` = name + start–end time + status; the all-day band is a labeled region; `NowIndicator` is `aria-hidden`.
- **Agenda** — a `list`; each day a heading (`<h3>`/`role="heading"`) + its events as a nested list of buttons. The most screen-reader-friendly view (the mobile default).
- **Toolbar** — view switch is a `toggle-group` (radio semantics, single-select); prev/next/today are labeled buttons; `M`/`W`/`D`/`A` shortcuts. Focus is preserved/retargeted sensibly on view + date change.
- **Event label contract:** name + human date/time + status, everywhere (Success-criterion 6).

---

## 10. Risks & alternatives

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Time-grid complexity** (lane-packing, DST hour rows, scroll math) | Logic isolated in pure `lane-pack.ts` + `date-range.ts` (Vitest-ready); a stress fixture (dense day) in the demo; date-fns owns DST. |
| R2 | **Month spanning-bar segmentation** across week rows is fiddly (stable lanes, continuation) | Pure `segments.ts` with a deterministic lane algorithm; visual demo fixture with a 3-week event. |
| R3 | **Classification edge cases** (all-timestamp data, midnight) | Three-layer rule + `classifyEvent` escape hatch (§4.3); demo shows a date-only all-day item + a midnight-timed item rendering correctly. |
| R4 | **Tree-shaking leak** (month-only path pulling time-grid / todo-rich-card) | Independent view modules + lazy tooltip; GATE-3 verifies the "Lighter" subset; smoke confirms bundle. |
| R5 | **Cross-backend primitive divergence** (toggle-group / popover / tooltip / calendar on Base UI vs Radix) | Defensive usage now + the 4-ship cross-backend smoke; budget a v0.1.1 (R5 == the §5 smoke risk). |
| R6 | **shadcn `calendar` theming** for the mini-nav | Already themed in-repo (`src/components/ui/calendar.tsx`); mini-nav is opt-in + visually scoped. |

**Alternatives considered + rejected:** (a) *adopt FullCalendar / react-big-calendar* — rejected: heavy, foreign data model, design-system mismatch, defeats the "native `TodoItem` surface" purpose. (b) *render the month grid on react-day-picker* — rejected: it's a date *picker*, not an event grid (D7); used only for the mini-nav. (c) *one mega view component with a `view` switch internally* — rejected: defeats tree-shaking + the compound mandate; views are independent modules. (d) *add `allDay` to `TodoItem`* — rejected: forks the shared type for a calendar-only concern (D5 uses a predicate + date-only strings instead).

---

## 11. Build order (implementation milestones)

1. `pnpm new:component data/calendar-01` → generates the **7 flat files**. **Create `parts/`, `hooks/`, `lib/` by hand** (scaffolder emits no subfolders). Wire `types.ts` (import + re-export todo-rich-card) + `meta.ts`.
2. **lib/ first** (pure, testable): `classify` + `color` (both feed occurrences) → `date-range` → `occurrences` → `segments` → `lane-pack`.
3. **Root + hooks**: `use-calendar-cursor`, `use-now-tick`, context, handle, occurrences memo, `onRangeChange`.
4. **Views**: Month (segments + chips + "+N more") → Agenda → shared `TimeGrid` → Week → Day. Tier-C primitives alongside.
5. **Toolbar + MiniNav**, keyboard model, then **Assembly** `Calendar01` + `show*` gating.
6. `dummy-data` + `demo` (incl. the "Lighter" subset tab) + `usage`; manifest 3-line edit; verify `/components/calendar-01`.
7. `registry.json` (base + `calendar-01-fixtures`) → `pnpm registry:build` → spot-check artifact.
8. Gates: `tsc` · `lint` · `validate:meta-deps` · `pnpm build` · `registry:build`. Author the **guide** doc.
9. **GATE 3** spotcheck (5 fixed dims + 1 rotating — propose **Public API** or **Robustness** as rotating, given the broad surface). Verdict ≥ Pass-with-follow-ups.
10. STATUS.md + decision file; commit + push; **post-deploy cross-backend smoke** (R5) → likely v0.1.1.

---

> **On sign-off (GATE 2):** implementation begins at step 1 above. The first code action is `pnpm new:component data/calendar-01` — not before.

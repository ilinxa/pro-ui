# `gantt-timeline-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** 🟢 Reviewed (internal + external consistency pass, 2026-06-20) · approved to proceed → GATE 2
> **Slug:** `gantt-timeline-01` · **Category:** `data` · **Tier:** pro-component (ships as a **shadcn-style compound** — see §0)
> **Conceptual lineage:** Gantt charts (MS Project, GanttPRO, Instagantt, dhtmlxGantt) + modern roadmap timelines (Linear cycles, Notion timeline, Asana timeline, Height).
> **Display sibling of [`todo-rich-card`](../../../src/registry/components/data/todo-rich-card/) and [`kanban-board-01`](../../../src/registry/components/data/kanban-board-01/).** It does **not** extend or embed either — it is a fresh, standalone procomp that consumes the **same canonical `TodoItem[]`** the card renders, and lays the items out on a horizontal time axis instead of in cards or columns. *Same data genes, different surface.* The fourth member of the project-management set; its twin, **`calendar-01`, is the next procomp (not yet built)**.

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, give a precise inventory of the data it visualizes + the states it must cover, surface the open design decisions, and earn sign-off before any planning or code.

> 🎯 **Read-me-first.** §4 is the **exact data structure** every bar is drawn from (the canonical `TodoItem`, verified against [`todo-rich-card/types.ts`](../../../src/registry/components/data/todo-rich-card/types.ts)). §10 is the **coverage checklist** — every view, zoom level, and visual state to produce. The component is **read-only in v1** (no drag/resize/create), so this is a *display* surface, not an editor — but its state model is architected so v2 drag-to-reschedule drops in without a rewrite (§7-D3).

---

## 0. Compound-structure declaration (mandated)

`gantt-timeline-01` trips **every** trigger in [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md): ≥3 distinct mountable regions (gutter / axis header / chart body / overlay), it composes another procomp (`todo-rich-card`, optionally, in the tooltip slot), and it pulls a heavy dep (row virtualization). **Therefore it ships as a shadcn-style compound** — headless `Root` provider + flat à-la-carte parts + standalone primitives + one logic-free assembly. Flat exports, never a `Name.Root` namespace.

**Rough part inventory** (precise tier split + names are locked at GATE 2):

| Tier | Members (rough) | Role |
|---|---|---|
| **B — headless Root** | `GanttTimelineRoot` | Owns data normalization, effective-window math, the **viewport (pan offset + continuous px-per-time zoom) + gesture handlers (drag/swipe/pinch/wheel, momentum, boundary resistance)**, collapse + selection state, the `now`-tick + color engine, the imperative handle, and the context. Renders `children`. |
| **B — context parts** (flat) | `GanttTimelineToolbar` · `GanttTimelineGutter` · `GanttTimelineAxis` · `GanttTimelineBody` | One module per region; each reads `useGanttTimeline()` — no prop-drilling. |
| **C — standalone primitives** (context-free) | `GanttBar` · `SummaryBar` · `MilestoneDiamond` · `TodayLine` · `GutterRow` · `AxisHeader` · `BarTooltip` (lightweight default; the full-card path is the lazy `renderTooltip`) | Dumb, prop-driven; usable anywhere. |
| **A — assembly** | `GanttTimeline01` | `Root` + the parts above, gated by `show*` toggles. Contains no logic the parts don't. Demo + screenshot use this. |

**Tree-shaking story:** each part is its own module re-exported from the barrel. Row virtualization is isolated; the **full-card tooltip path** (`renderTooltip` → `todo-rich-card`) is `React.lazy` so a consumer who keeps the default lightweight tooltip never pulls `todo-rich-card` into their graph. A read-only, gutter-only, or body-only subset must fall out for free.

---

## 1. Problem

Every project / planning surface eventually needs to answer **"what runs when, and what overlaps?"** — a question cards and columns can't answer because they have no time axis:

- sprint / cycle planning — see which tasks straddle the same week
- content / publication schedules — embargo → sunset windows side by side
- agent / pipeline run windows — start/expire bands per run
- delivery roadmaps — parent epics summarising their child tasks
- personal week-at-a-glance planning

**We already carry the data for this.** The canonical `TodoItem` — the JSON that drives `todo-rich-card`, nests in `todo-tree`, and can render inside a `kanban-board-01` column via the card's `todoRichCardKanbanRenderer` adapter — ships `setAt` / `startAt` / `expireAt` / `duration`, a consumer-defined `status`, `priority`, `labels`, people, and infinite `children`. What's missing is the **primitive that lays those items on a time axis** — a Gantt/timeline that:

1. draws one **bar per task** from its effective start to its effective end,
2. rolls **`children` up into collapsible WBS summary rows** with summary bars,
3. paints **urgency + status** onto each bar using the **same color engine** as `todo-rich-card` (imported, not re-implemented),
4. and consumes **`TodoItem[]` directly** — so a product's "Timeline" tab is literally the same task data its "List" (rich cards) and "Board" (kanban) tabs show, on a third surface.

Today every product hand-rolls this (1–3 weeks each, accessibility usually skipped). This procomp is that primitive.

> **Correction vs the original brief:** `kanban-board-01` does **not** consume `TodoItem[]` natively — it has its own `KanbanData` (columns + items) model and bridges to the card through `todoRichCardKanbanRenderer`. The honest shared spine is the **canonical `TodoItem` type**, which `todo-rich-card` and `todo-tree` render directly and which this gantt consumes directly. "Same array as the board" is replaced by "same canonical item type."

### Release strategy — phased

| Version | Scope |
|---|---|
| **v1 (this doc)** | Read-only timeline. Bars from effective start→end, WBS hierarchy from `children` with collapsible summary bars, milestone diamonds, a **pan/swipe/zoom-navigable** two-tier time axis (continuous zoom; hour→quarter header buckets), today line, overdue treatment, status/urgency **filled** bars, hover tooltip, selection, keyboard nav. Consumes `TodoItem[]`. Standalone-usable. **State model architected for drag (§7-D3) — write callbacks reserved, not shipped.** |
| **v2** | Interaction: drag-to-reschedule + edge-resize (writes `startAt`/`expireAt`), marquee selection, in-place create. (Promoted ahead of dependencies per the v1 architecture decision.) |
| **v3** | Dependencies: a `dependsOn?: string[]` field on `TodoItem` + finish-to-start arrows (deferred, design-reserved §7-D1). |
| **v4** | Progress %, baselines, critical path, resource swimlanes. |

Each step is independently shippable; v1 alone is a registerable, data-faithful display.

---

## 2. In scope / Out of scope

### v1 — in scope

**Rows & hierarchy**
- One **row per top-level `TodoItem`**. A row's `children` render as **indented sub-rows** (WBS / outline), to arbitrary depth.
- A parent row is a **summary row**: its bar spans `min(child starts) → max(child ends)` (a summary bar, visually distinct — bracket / ⊟ end-caps), and it is **collapsible** (collapse hides descendants; the summary bar stands in).
- Collapse/expand is **UI-only state** (not part of the `TodoItem` schema) — exactly like `todo-rich-card`'s `collapsedIds`.

**Bars**
- Bar geometry per item: **effective start** = `startAt ?? setAt`; **effective end** = `expireAt ?? (effectiveStart + duration)`. If neither `expireAt` nor `duration` exists, the item is a **milestone** (zero-length) — rendered as a **diamond** at the effective start, not a bar.
- **Overdue**: effective end is in the past and the item's status tone is not `done` — red end-cap / hatch treatment.
- **Inactive** (`active: false`): dimmed bar (~50% opacity, still selectable).
- Bar **label**: task `name`, truncated, with an overflow tooltip.

**Color** — reuse `todo-rich-card`'s engine (consistency is a hard requirement)
- **Filled bars** (locked §7-D5). Default fill comes from the item's **status tone** via consumer-supplied `statusOptions`: `active` tones use the **time-urgency ramp** (fresh green → red as the window elapses), `done` → gray, `blocked` → red. The ramp is imported from `todo-rich-card` (`TodoColorRamp` + its ramp lib), not re-derived.
- Per-item `borderColor` override is honoured (skips the engine for that bar), same as the card.

**Time axis**
- **Continuously zoomable**, with a **two-tier header** (major scale + minor scale). The real zoom state is **pixels-per-time**; the five named levels — **hour · day · week · month · quarter** — are *header-scale buckets* the continuous scale auto-selects as you cross thresholds (minor tier = the cell grid, major tier groups it; e.g. minor = day, major = month). Buttons + keyboard step the named levels; gestures scrub continuously. Default `week`.
- **Today marker**: a vertical "now" line spanning the chart body.
- The row-label **gutter is frozen** (sticky left column) while the chart body pans/zooms.
- Weekend / non-working shading — prop-gated, off by default (§7-D6).

**Navigation (read-only — pan / swipe / zoom)** *(locked §7-D12)*
- **Pan / swipe** the chart body by dragging: single-pointer drag with **dominant-direction lock** (horizontal = time, vertical = rows), **flick momentum**, and **boundary resistance** (×0.25) at the data extents — mirrors `story-viewer-01`'s swipe + `media-editor-01`'s drag-to-pan.
- **Continuous zoom toward the cursor / pinch focal point** (the time under the pointer stays put): **pinch** on touch, **⌘/ctrl + wheel** on desktop; **plain wheel** = horizontal time-pan; **trackpad two-finger** scrolls both axes. The two-tier header auto-adapts its scale (with hysteresis, so it doesn't thrash at thresholds).
- **Explicit controls too:** toolbar **+ / − / fit** buttons and keyboard (`+`/`−` zoom, arrows pan, Home/End jump to chart start/end) — gestures are an enhancement, never the only path.
- Read-only: pan + zoom move the viewport only; they never mutate `TodoItem` data. (Drag-to-*reschedule* is the separate v2 feature — §7-D3.)

**Row-label gutter (frozen left column)**
- Per row: disclosure caret (if it has children), task `name`, optional `targetPerson` avatar, optional status badge, optional label dots. Width is a prop; density scales with `rowHeight`.

**Read-only interactions**
- **Hover** a bar → **lightweight tooltip** (name + dates + assignee + status) by default; a `renderTooltip` slot overrides it (and may lazy-embed the full `<TodoRichCard>`) — locked §7-D7.
- **Click** a bar/row → selection highlight + `onTaskClick(item)` (consumer wires what opens).
- **Collapse/expand** summary rows.
- Keyboard: arrow-key row navigation, Enter fires `onTaskClick`, Home/End jump the viewport to chart start/end.

**Empty / loading / boundary states**
- Empty (`data: []`), loading (skeleton rows + skeleton axis), single-item, deeply-nested, all-milestones, items entirely outside the visible window (pan-to indicator at the gutter edge — §7-D10).

**Portability**
- Zero `next/*` imports; no `process.env`; no app context. Registry-import rules: only `react`, `@/components/ui/*`, `@/lib/utils`, the declared third-party deps, and same-category relative imports of `todo-rich-card`. SSR-safe (the "now" line + urgency color compute from a `now` prop on first paint, then a client interval refreshes — same contract as the card's `colorRefreshIntervalMs`).

### v1 — out of scope (deferred)

- **Drag-to-reschedule, edge-resize, marquee select, in-place create** → v2 (read-only v1, locked §7-D3 — but the data contract + state model are built to absorb it).
- **Dependencies / arrows** → v3 (the `TodoItem` schema has no dependency field; we do **not** add one in v1, locked §7-D1).
- **Progress %, baselines, critical path, resource levelling, swimlanes** → v4.
- **Recurrence** (no RRULE — consumer produces fresh `TodoItem`s).
- **Cross-timezone scheduling** beyond rendering ISO timestamps in a single display timezone.
- **Export** (PNG/PDF/print) — consumer concern in v1.

### Deliberate non-goals (any version)

- **Not a calendar.** Date-grid layout (month/week/day cells, agenda) is the planned sibling **`calendar-01`** (next procomp). This component is a continuous-axis bar chart with task rows.
- **Not a task editor.** It renders `TodoItem`s; editing is `todo-rich-card`'s / the list shell's job.
- **Not a server-state synchroniser.** Consumer wires data + persistence.
- **Not a project-scheduling engine.** No auto-scheduling, levelling, or constraint solving.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Project / task module** *(primary)* | A "Timeline" tab next to List + Board | Same `TodoItem[]` as the card/tree, on a time axis; WBS from `children`; urgency color matching the card |
| **Roadmap / delivery view** *(primary)* | Quarter roadmap of epics → tasks | Collapsible summary bars; month/quarter zoom; today line |
| **Content schedule** *(primary)* | Editorial embargo→sunset planner | Bars from `startAt`→`expireAt`; overdue treatment; week/day zoom |
| **Agent / pipeline run viewer** *(secondary)* | Run windows per job | Dense rows, hour/day zoom, urgency color as SLA cue |

Non-targets: calendar grids (→ `calendar-01`), single-card detail (→ `todo-rich-card`), status-flow boards (→ `kanban-board-01`).

---

## 4. Data structure — what every bar is drawn from

**The component consumes `TodoItem[]` verbatim.** No new data shape is introduced in v1. This is the canonical type (source of truth: [`src/registry/components/data/todo-rich-card/types.ts`](../../../src/registry/components/data/todo-rich-card/types.ts), re-exported from its `index.ts`). Treat this as the contract — every visual element maps to a field below.

```ts
type TodoItem = {
  id: string;
  name: string;              // → bar label + gutter row label
  description?: string;      // → tooltip body
  status: string;            // → bar fill (via statusOptions tone/variant)
  active: boolean;           // → false = dimmed bar
  setAt: string;             // ISO-8601, REQUIRED — fallback bar start
  startAt?: string;          // ISO-8601 — effective bar start (defaults to setAt)
  expireAt?: string;         // ISO-8601 — effective bar end (wins over duration)
  duration?: number;         // ms — bar end = start + duration (only if no expireAt)
  targetPerson?: TodoPerson; // → assignee avatar in the gutter + tooltip
  creatorPerson?: TodoPerson;// → tooltip
  images?: TodoImage[];      // → tooltip only (not on the bar)
  links?: TodoLink[];        // → tooltip only
  priority?: string;         // → optional priority pip on the bar (via priorityOptions)
  labels?: string[];         // → optional label dots in the gutter (via labelOptions)
  borderColor?: string;      // → per-bar color override (skips the urgency engine)
  locked?: boolean;          // → (no drag in v1; reserved for v2) shown as a tiny lock glyph
  children?: TodoItem[];     // → indented WBS sub-rows; parent becomes a summary bar
};

type TodoPerson = { id: string; name: string; avatar?: string };
type TodoImage  = { src: string; alt?: string; caption?: string };
type TodoLink   = { url: string; label?: string; icon?: string };
```

### Field → visual mapping (the design table)

| `TodoItem` field | Where it shows | Notes for design |
|---|---|---|
| `name` | Gutter row label + on-bar label | Truncate with ellipsis; full name in tooltip |
| `status` + `statusOptions` | **Bar fill color** | `done` → gray, `blocked` → red, active tones → urgency ramp |
| `active=false` | Dimmed bar | ~50% opacity; still selectable |
| `startAt ?? setAt` → `expireAt ?? start+duration` | **Bar extent** | Core geometry. No end → **milestone diamond** |
| effective end in the past & tone ≠ done | **Overdue** treatment | Red end-cap / hatch |
| `targetPerson.avatar` | Gutter avatar (+ tooltip) | Fallback to initials chip |
| `priority` + `priorityOptions` | Optional pip/flag on the bar | Single-valued; color from option |
| `labels` + `labelOptions` | Optional color dots in the gutter | Many-to-many |
| `borderColor` | Overrides bar color for that node | Any CSS color |
| `children` | Indented sub-rows; parent = summary bar | Collapsible; summary spans child min→max |
| `description`/`images`/`links`/`creatorPerson` | **Tooltip only** | Not on the bar itself |

### Effective-window resolution (deterministic — lock this in design)

```
effectiveStart = startAt ?? setAt
effectiveEnd   = expireAt ?? (duration ? effectiveStart + duration : null)
isMilestone    = effectiveEnd === null      → diamond at effectiveStart
isOverdue      = effectiveEnd && effectiveEnd < now && statusTone !== "done"
```

---

## 5. Rough API sketch (NOT final — that's the plan stage)

Illustrative. The canonical shape lands in `src/registry/components/data/gantt-timeline-01/types.ts` at plan stage; defer to it on naming. **Option + ramp types are imported from `todo-rich-card`** — same color/label language, zero duplication. (Internally this is a *same-category relative* import: `../todo-rich-card`; consumers installing both via the registry get the dependency declared in `meta.ts`.)

```ts
import type {
  TodoItem, TodoStatusOption, TodoPriorityOption, TodoLabelOption, TodoColorRamp,
} from "@/registry/components/data/todo-rich-card";

export type GanttZoom = "hour" | "day" | "week" | "month" | "quarter";

export type GanttTimelineProps = {
  /** The tasks to lay out. The canonical TodoItem[] the card/tree render. */
  data: TodoItem[];

  // Color + label language (shared with todo-rich-card)
  statusOptions?: TodoStatusOption[];
  priorityOptions?: TodoPriorityOption[];
  labelOptions?: TodoLabelOption[];
  /** Same urgency ramp the card uses; default "default". */
  colorRamp?: TodoColorRamp;
  colorRefreshIntervalMs?: number;     // default 60_000; 0 disables

  // Time axis
  zoom?: GanttZoom;                    // controlled (nearest named level)
  defaultZoom?: GanttZoom;             // uncontrolled (default "week")
  onZoomChange?: (zoom: GanttZoom) => void;
  /** Clamp the continuous zoom; default span hour…quarter. */
  minZoom?: GanttZoom;
  maxZoom?: GanttZoom;
  /** Fires when the viewport pans/zooms (read-only navigation). */
  onViewportChange?: (window: { from: string; to: string }) => void;
  /** Opt out of gesture nav; +/−/fit buttons + keyboard still work. */
  disableGestures?: boolean;
  /** Initial visible window; defaults to fit-all-bars + padding. */
  range?: { from: string; to: string };
  /** Frozen clock for SSR/testing; drives the "now" line + urgency. */
  now?: Date | (() => Date);

  // Layout
  rowHeight?: number;                  // px; default 36
  gutterWidth?: number;                // px; default 280
  showWeekendShading?: boolean;        // default false (§7-D6)
  showToolbar?: boolean;               // assembly toggle (zoom + today + expand/collapse-all)

  // Collapse (UI-only)
  defaultCollapsedIds?: string[];
  collapsedIds?: string[];             // controlled
  onCollapsedChange?: (ids: string[]) => void;

  // Read-only interactions
  selectedId?: string;
  onSelect?: (itemId: string | null) => void;
  onTaskClick?: (item: TodoItem) => void;
  /** Override the hover tooltip; default = lightweight summary. */
  renderTooltip?: (item: TodoItem) => React.ReactNode;

  // ── Reserved for v2 (typed now so the contract is stable; NOT wired in v1) ──
  /** @reserved v2 — fires when a bar is dragged/resized to a new window. */
  onTaskReschedule?: (next: { itemId: string; startAt: string; expireAt?: string }) => void;

  className?: string;
  "aria-label"?: string;
};

// Imperative handle (read-only surface)
export type GanttTimelineHandle = {
  scrollToDate(date: string): void;
  scrollToItem(itemId: string): void;
  scrollToToday(): void;
  expandAll(): void;
  collapseAll(): void;
  setZoom(zoom: GanttZoom): void;
  /** Continuous-zoom helpers (pan/zoom canvas, §7-D12). */
  zoomBy(factor: number): void;
  zoomToFit(): void;
};
```

**Surface budget:** ~6 prop categories, read-only (no edit/event storm). Counting *feature concepts* — controlled/uncontrolled pairs (`zoom`/`defaultZoom`, `collapsedIds`/`defaultCollapsedIds`, `selectedId`/`onSelect`) as one each, and excluding boilerplate (`className`, `aria-label`) + the reserved-for-v2 `onTaskReschedule` — this sketch is **~21 concepts, under the ~25 ceiling**. If a real v1 blows past ~25 feature concepts, the API is wrong and we restart this section; the compound parts must absorb the overflow.

---

## 6. Example usages

### 6.1 — A "Timeline" tab (the primary consumer)

```tsx
import { GanttTimeline01 } from "@/registry/components/data/gantt-timeline-01";
import { STATUS_OPTIONS } from "@/domains/tasks/status"; // consumer's own status palette

function TasksTimeline({ tasks }: { tasks: TodoItem[] }) {
  return (
    <GanttTimeline01
      data={tasks}                       // same TodoItem[] as the List + Board tabs
      statusOptions={STATUS_OPTIONS}
      defaultZoom="week"
      onTaskClick={(t) => openTaskDetail(t.id)}
    />
  );
}
```

The same `TodoItem[]` that renders as rich cards (List) and can render in kanban columns (Board) now renders as bars — `children` become indented WBS rows, a parent becomes a collapsible summary bar over its subtasks, and a blocked item past its `expireAt` shows the overdue red treatment.

### 6.2 — Quarter roadmap, collapsed to epics

```tsx
<GanttTimeline01
  data={epics}
  defaultZoom="quarter"
  defaultCollapsedIds={epics.map((e) => e.id)}   // show only summary bars
  statusOptions={ROADMAP_STATUSES}
/>
```

### 6.3 — Composed / lighter (no toolbar, custom gutter) — proves the compound path

```tsx
import {
  GanttTimelineRoot, GanttTimelineAxis, GanttTimelineBody, GanttTimelineGutter,
} from "@/registry/components/data/gantt-timeline-01";

<GanttTimelineRoot data={tasks} statusOptions={STATUS_OPTIONS} defaultZoom="day">
  <div className="flex">
    <GanttTimelineGutter />
    <div className="flex-1">
      <GanttTimelineAxis />
      <GanttTimelineBody />
    </div>
  </div>
</GanttTimelineRoot>
```

---

## 7. Decisions

Locked rows reflect this session's GATE-1 answers; open rows recommend a default and confirm at sign-off / plan stage.

| # | Question | Decision |
|---|---|---|
| **D1** | **Dependencies** | 🔒 **No dependencies in v1.** The `TodoItem` schema has no dependency field and we do not add one now. Ordering is by date only. Arrows + a `dependsOn?: string[]` field → **v3**. |
| **D2** | **Hierarchy source** | 🔒 **`children` = WBS rows.** Parents are collapsible summary rows whose bar spans child min→max. No artificial grouping construct. |
| **D3** | **Interactivity** | 🔒 **Read-only v1, architected for drag.** No drag/resize/marquee/create ships. BUT the state model is controlled/uncontrolled-ready and `onTaskReschedule` is typed-but-dormant, so **v2 drag drops in without an API/state rewrite** (user's GATE-1 call). |
| **D4** | **Zoom model / levels** | 🔒 **Continuous zoom** (px-per-time) with the five named levels — **hour · day · week · month · quarter** — as auto-adapting two-tier-header buckets; default `week`. Buttons/keyboard step the named levels, gestures scrub continuously (user's GATE-1 call). Design all five header treatments + the in-between scaling. |
| **D5** | **Bar color: fill vs border** | 🔒 **Filled bars** (user's GATE-1 call). Status-tone fill + time-urgency tint; overdue = red end-cap. Verified against light + dark `--card`/`--background`. The ramp engine is **imported from `todo-rich-card`**, not re-implemented. |
| **D6** | **Weekend / non-working shading** | 🔒 **Locked to the recommendation** (no override given): prop-gated `showWeekendShading`, **OFF by default**, applies at day/week zoom only, shade token `--muted`. Revisitable at design without an API change (it's one boolean). |
| **D7** | **Hover tooltip content** | 🔒 **Lightweight summary by default** (name + dates + assignee + status); `renderTooltip` slot overrides and may lazy-embed the full `<TodoRichCard>` (user's GATE-1 call). Keeps `todo-rich-card` out of the default bundle. |
| **D8** | **Milestone definition** | 🔒 An item with **no `expireAt` and no `duration`** is a milestone → diamond at `effectiveStart`. Deterministic in §4. |
| **D9** | **Slug / category** | 🔒 `data/gantt-timeline-01`. `-01` suffix follows `kanban-board-01`, `media-library-01`. |
| **D10** | **Out-of-window items** | 🔒 **Resolved into the pan/zoom canvas (§7-D12).** Default viewport = fit-all-bars + padding; the body is freely pannable/zoomable, so any item is reachable by panning. An off-screen item shows a **gutter-edge indicator that pans-to-it on click** (`scrollToItem`). No auto-expand. |
| **D11** | **Compound structure** | 🔒 **Ships as a shadcn-style compound** (§0) — mandated by the rule. Rough part inventory in §0; precise tier split at GATE 2. |
| **D12** | **Navigation model** | 🔒 **Pannable / zoomable canvas** (user's GATE-1 call): axis-aware drag-pan with **momentum + boundary resistance**, **continuous focal-point zoom** (pinch · ⌘/ctrl+wheel) with auto-adapting header, plain-wheel time-pan, plus explicit + / − / fit buttons + full keyboard. All **read-only navigation** (moves the viewport, never the data). |

---

## 8. Risks

- **Urgency-color consistency with the card.** Bars MUST use the same ramp/tones as `todo-rich-card` or the tabs look incoherent. Plan **imports** the card's color engine (`TodoColorRamp` + ramp lib), never re-implements it.
- **Density at hour zoom.** Many short bars at hour zoom create label collisions. Design must specify the label-hide / tooltip-only threshold.
- **Summary-bar correctness with mixed milestones.** A parent whose children are all milestones has a zero-or-point span; design must specify how that summary renders.
- **Frozen-gutter + horizontal-scroll perf** on large trees. Plan must **virtualise rows** — the house choice is `@tanstack/react-virtual` (already used by `todo-tree`, `file-tree`, `file-manager`); confirm at plan stage.
- **SSR "now" determinism.** First paint must use the `now` prop; the client interval refreshes afterward — same trap the card solved. Document it.
- **Overflowing time range** auto-fit can produce an absurd zoom; clamp.
- **Architecting-for-drag without shipping it** (D3): the reserved `onTaskReschedule` + controlled data path must be real enough that v2 is additive, but must not leak half-built drag affordances into v1. Plan states the seam explicitly.
- **Gesture conflict** (D12): horizontal time-pan vs vertical row-scroll vs page-scroll — dominant-direction lock + a hit-test that yields to interactive overlays (tooltip, toolbar). Plan specifies the arbitration.
- **`onWheel` is passive in React** (known `story-composer-01` trap): `preventDefault` on ⌘/ctrl+wheel zoom needs a **non-passive** native listener via `addEventListener`, not the React `onWheel` prop. Document it.
- **Continuous-zoom header thrash**: auto-adapting the major/minor scale exactly at thresholds flickers; use **hysteresis** (switch up at X, back down at ~0.8X).
- **Pan/zoom + virtualization**: momentum + focal-point zoom must stay smooth while rows virtualize via `@tanstack/react-virtual`; the transform/scroll model must not fight the virtualizer. Prototype this seam early.
- **Cross-procomp dependency wiring** (`todo-rich-card`): the shared types (`TodoItem`, option types, `TodoColorRamp`) come from `todo-rich-card` via a **same-category relative import** (`../todo-rich-card`), which the registry rewriter leaves untouched (rewriter-safe). But `todo-rich-card` must still be a **declared `registryDependency`** (in `meta.ts` *and* `registry.json`) so the relative path resolves in a consumer install. **Type-only imports still require the package installed** for consumer-tsc — the `content-composer-01` F-01 lesson. Plan locks both.

---

## 9. Success criteria

v1 ships when:

1. **`TodoItem[]` renders** — every field in §4's table produces its mapped element.
2. **Effective-window math is deterministic** — §4's resolution holds for all four date combinations (startAt/expireAt, startAt/duration, setAt-only milestone, expireAt-only).
3. **Hierarchy** — `children` indent into WBS rows; parents are correct summary bars; collapse hides descendants.
4. **Zoom** — all five levels render a correct two-tier header and re-lay bars; default `week`.
5. **Today line + urgency color** refresh at `colorRefreshIntervalMs`; SSR-safe first paint.
6. **Overdue + inactive + milestone + locked** treatments all render distinctly.
7. **Read-only interactions + navigation** — hover tooltip, click selection + `onTaskClick`, collapse/expand; **pan/swipe with momentum + boundary resistance, continuous focal-point zoom (pinch · ⌘/ctrl+wheel) with auto-adapting header, + / − / fit buttons, full keyboard nav**; gestures are SSR-safe and degrade to buttons when `disableGestures`.
8. **States** — empty, loading, single-item, deep-nest, out-of-window all designed + built.
9. **Color matches `todo-rich-card`** — the **time-urgency ramp** (active tones) is the *imported* engine and matches the card exactly; `done`/`blocked` tones are *adapted to filled bars* (done → gray, blocked → red) rather than the card's gray-border-plus-overlay treatment. The visual diff focuses on the ramp.
10. **Compound is real** — flat exports; a hand-assembled subset (§6.3) renders; default tooltip keeps `todo-rich-card` out of the bundle; the demo includes a "Composed / lighter" example.
11. **A11y** — rows are a navigable list; bars announce name + dates + status; gutter is a proper tree.
12. **Portability** — no `next/*`, no `process.env`, SSR-safe, registry-import-clean.
13. **Demo + (deferred) tests** — demo exercises all zoom levels + states; window-math + hierarchy roll-up are unit-testable (Vitest informed-defer per house convention).

---

## 10. Design coverage checklist (what design must produce)

> Each box is a screen/state to define against the **ilinxa-ui-pro design system** ([`src/app/globals.css`](../../../src/app/globals.css)): **signal-lime** accent `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark (always with near-black `--primary-foreground`), cool off-white `--background` (raised `--card`/`--popover` to pure white), graphite-cool dark surfaces, **Onest** (sans) / **JetBrains Mono** (mono), one orchestrated `reveal-up` entrance (60ms stagger). **Forbidden:** pure-white page backgrounds, purple-on-white gradient clichés, neon-saturated lime (keep chroma ≤ 0.20), Inter/Roboto/Geist/system-font defaults.

**A. Time-axis header (×5 zoom levels)**
- [ ] hour · day · week · month · quarter — each with its two-tier (major + minor) header treatment, today marker, weekend-shading variant (D6).

**B. Bar anatomy** (filled, per D5)
- [ ] Active bar (urgency ramp fill) · done (gray) · blocked (red) · overdue end-cap · inactive (dimmed) · milestone diamond · summary/parent bar (end-caps) · per-item `borderColor` override · on-bar label + truncation · priority pip · locked glyph.

**C. Row gutter (frozen left column)**
- [ ] Leaf row · parent row with caret (expanded / collapsed) · indent steps · assignee avatar + initials fallback · status badge · label dots · selected-row highlight · row hover.

**D. Interactions + navigation (read-only)**
- [ ] Hover tooltip (lightweight default, D7) · click/selection state · keyboard focus ring · **grab / grabbing cursor + drag-pan feel · momentum + boundary-resistance behaviour · pinch / wheel zoom toward focal point · toolbar zoom controls (+ / − / fit) · pan-to indicator for off-screen items (D10)** · sticky gutter during pan/zoom.

**E. States**
- [ ] Empty · loading skeleton (axis + rows) · single item · deeply nested · all-milestones · dense (hour zoom) · error.

**F. Responsive**
- [ ] Wide desktop · medium · narrow (gutter collapse / horizontal-scroll-only behaviour).

**G. Tokens & motion**
- [ ] Map every color to a design token (status tones, urgency ramp endpoints, today line, weekend shade, grid lines). One orchestrated `reveal-up` entrance on first mount.

---

## 11. Definition of "done" for THIS document (stage gate)

- [x] §§0–10 drafted, reconciled to `ilinxa-ui-pro` conventions (paths, imports, design tokens).
- [x] Data structure pinned to the **real** canonical `TodoItem` (§4), verified against `todo-rich-card/types.ts`.
- [x] Compound-structure declared with rough part inventory (§0) — per the mandatory rule.
- [x] GATE-1 answers recorded: D3 read-only-architected-for-drag, D4 continuous zoom, D5 filled bars, D7 lightweight tooltip, D12 pan/swipe/zoom navigation (§7).
- [x] Navigation model (pan/swipe/zoom, D12) locked per the user; **D10 resolved into it**.
- [x] D6 (weekend shading) locked to the off-by-default recommendation (no override given); a one-boolean design-time revisit is non-breaking.
- [x] Review pass (2026-06-20): internal + external consistency verified; 5 refinements applied (boundary wording, surface-budget counting, cross-procomp `registryDependency` risk, ramp-match scope, tooltip primitive).
- [x] **User approved to proceed** ("review and confirm… then move on") → Stage 2 (`gantt-timeline-01-procomp-plan.md`, GATE 2) **now in progress**.

After sign-off, changes to this doc are loud and intentional, not silent rewrites.

# `gantt-timeline-01` — Consumer Guide (Stage 3)

> **Stage:** 3 of 3 · **Version:** v0.1.0 · **Status:** alpha
> Install: `pnpm dlx shadcn@latest add @ilinxa/gantt-timeline-01` (pulls `@ilinxa/todo-rich-card` + `@tanstack/react-virtual` + `lucide-react`).

A read-only, fully-navigable project timeline (Gantt) over the canonical `TodoItem[]`. The time-axis sibling of `todo-rich-card` (cards) and `kanban-board-01` (columns).

---

## When to use

- A **"Timeline" tab** beside List (rich cards) and Board (kanban) — the same `TodoItem[]`, on a time axis.
- A **roadmap** — collapse to epics; month/quarter zoom; today line.
- A **content schedule** — embargo→sunset bars; overdue treatment; week/day zoom.
- **Agent / pipeline run windows** — dense rows, hour/day zoom, urgency color as an SLA cue.

## When NOT to use

- You need a **date-grid calendar** (month/week/day cells) → that's the planned `calendar-01`, not this.
- You need to **edit** a task → that's `todo-rich-card`. v1 here is read-only display + navigation (drag-to-reschedule is v2).
- You need **dependency arrows / critical path** → deferred (v3 / v4).

---

## The data contract

The component consumes `TodoItem[]` verbatim — the **same canonical type** `todo-rich-card` renders. Each bar is drawn from:

```
effectiveStart = startAt ?? setAt
effectiveEnd   = expireAt ?? (duration != null ? start + duration : null)
isMilestone    = effectiveEnd == null        → diamond at effectiveStart
isOverdue      = end < now && status-tone !== "done"   → red end-cap
```

`children` become indented WBS sub-rows; a parent renders a **collapsible summary bar** spanning `min(child start) → max(child end)`. Color: status tone (`done`=gray, `blocked`=red, `active`=time-urgency ramp green→red, **imported from todo-rich-card**); `borderColor` overrides per item.

---

## Composition patterns

### Batteries-included

```tsx
import { GanttTimeline01 } from "@/components/gantt-timeline-01";

<GanttTimeline01
  data={tasks}
  statusOptions={STATUS_OPTIONS}
  priorityOptions={PRIORITY_OPTIONS}
  labelOptions={LABEL_OPTIONS}
  defaultZoom="week"
  onTaskClick={(t) => openDetail(t.id)}
/>
```

### Composed (lighter) — drop the toolbar, hand-place parts

`GanttTimelineRoot` holds all state + gestures; each part wires itself through context.

```tsx
import {
  GanttTimelineRoot, GanttTimelineAxis, GanttTimelineGutter, GanttTimelineBody,
} from "@/components/gantt-timeline-01";

<GanttTimelineRoot data={tasks} statusOptions={STATUS_OPTIONS} defaultZoom="day">
  <GanttTimelineAxis />
  <div className="flex h-[420px]">
    <GanttTimelineGutter />
    <GanttTimelineBody />
  </div>
</GanttTimelineRoot>
```

### Imperative handle

```tsx
const ref = useRef<GanttTimelineHandle>(null);
ref.current?.scrollToToday();
ref.current?.zoomToFit();
ref.current?.scrollToItem("task-42");   // expands ancestors + centers
ref.current?.setZoom("month");
```

### Full-card tooltip (opt-in, lazy)

```tsx
import { GanttFullCardTooltip } from "@/components/gantt-timeline-01";

<GanttTimeline01
  data={tasks}
  renderTooltip={(item) => <GanttFullCardTooltip item={item} />}
/>
```
`todo-rich-card`'s **value** is `React.lazy`-loaded only here — the default lightweight tooltip keeps it out of your bundle.

---

## Navigation

| Gesture | Action |
|---|---|
| Drag (horizontal) | Pan time (flick → momentum; resistance at data edges) |
| Drag (vertical, touch) | Scroll rows |
| Pinch / ⌘·ctrl + wheel | Zoom toward the cursor |
| Plain wheel | Scroll rows · **Shift+wheel** pans time |
| Toolbar `+ / − / Fit / Today` | Explicit zoom + jump |
| Gutter tree keys | ↑/↓ rows · ←/→ collapse/expand · Enter activates · Space toggles |

`disableGestures` turns off pointer/wheel gestures; the toolbar + keyboard still work.

---

## Gotchas

- **SSR determinism:** pass `now` (a `Date` or `() => Date`) for a deterministic first paint. If omitted, the today line + urgency tint resolve **after mount** (no hydration mismatch) and refresh on `colorRefreshIntervalMs` (default 60s; `0` disables).
- **Continuous zoom:** the five named levels (`hour`…`quarter`) are *header buckets* the continuous `pxPerMs` scale auto-selects via a single-threshold ladder — each level holds across a wide, stable `pxPerMs` band so the header doesn't thrash. `zoom`/`setZoom` snap to a named level; gestures scrub between.
- **Initial view** honors `defaultZoom` (capped to fit data) anchored at the data start. Use the **Fit** button / `zoomToFit()` for fit-all.
- **Chart height** is set by the assembly (`clamp(280px, 52vh, 560px)`); in a hand-assembly you control the wrapper height.
- **Milestones** (no `expireAt` and no `duration`) render as diamonds, not bars — make sure that's intended for tasks with only a `setAt`.
- **Weekend shading** (`showWeekendShading`) only paints at hour/day zoom.

---

## Accessibility

The gutter is a WAI-ARIA `tree` (`treeitem` + `aria-level` / `aria-expanded` / `aria-selected`); each row's `aria-label` carries name + dates + status, so screen-reader users get the full bar info there. Bars are mouse-decorative (`aria-hidden`). Arrow keys are tree navigation (a11y-correct); panning lives on gestures + toolbar. Overdue adds a *shape* (red end-cap) on the bar, and the gutter row carries the status as **badge text** — so state reads without relying on color. Momentum fling is suppressed under `prefers-reduced-motion`.

---

## Open follow-ups (v0.2+)

- **v2:** drag-to-reschedule + edge-resize (`onTaskReschedule` is already typed; data is controlled, so it's additive).
- **v3:** dependency arrows (`dependsOn?: string[]`).
- **v4:** progress %, baselines, critical path, resource swimlanes.
- A configurable chart `height` prop (currently assembly-fixed).
- `weekStartsOn` for non-Monday locales (currently Monday).

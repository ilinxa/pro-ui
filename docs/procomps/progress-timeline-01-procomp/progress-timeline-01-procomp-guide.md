# progress-timeline-01 — procomp guide

> Stage 3: how to use it.

## When to use

- Event registration windows (the kasder use case)
- Sprint / project deadline countdowns
- Sales / promotion windows ("Sale ends in 3 days")
- Course / module completion windows
- Fundraising / crowdfunding deadlines
- Application / submission windows (job apps, grant proposals, RFPs)

## When NOT to use

- **Vertical timeline** with milestone dots between events — different shape entirely.
- **Multi-segment / gantt-style ranges** — one bar, one window only.
- **Editable / draggable marker** — read-only display.
- **Pure 0–100 progress with no time semantic** — reach for shadcn `Progress` directly; this component's value-add IS the time-window state machine.

## Composition patterns

### Event registration window (the kasder use case)

```tsx
<ProgressTimeline01
  start={event.registrationOpens}
  end={event.date}
  heading="Zaman Çizelgesi"
  labels={{
    startLabel: "Kayıt Başlangıcı",
    endLabel: "Etkinlik Günü",
    beforeText: (s) => `${s.daysToStart} gün sonra başlıyor`,
    activeText: (s) => `${s.daysToEnd} gün kaldı`,
    afterText: "Etkinlik Sona Erdi",
  }}
/>
```

### Sale countdown (bare, no chrome)

```tsx
<ProgressTimeline01
  start={sale.startedAt}
  end={sale.endsAt}
  framed={false}
  marker="none"
  labels={{
    startLabel: "Sale started",
    endLabel: "Sale ends",
    activeText: (s) => `${s.daysToEnd} days left`,
  }}
/>
```

### Course progress with explicit value

```tsx
<ProgressTimeline01
  start={course.startDate}
  end={course.endDate}
  value={courseCompletion}              // % — overrides time-derived bar fill
  heading="Course Progress"
  labels={{
    startLabel: "Module 1",
    endLabel: "Module 12",
    activeText: () => `${courseCompletion}% complete`,
  }}
/>
```

`value` overrides bar fill but state machine still derives from `start` / `end` so the captions stay meaningful.

### Live-clock host

```tsx
function LiveTimeline({ event }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <ProgressTimeline01 start={event.start} end={event.end} now={now} />
  );
}
```

No internal `setInterval` — consumer drives the cadence.

## Public helper kernel — derive state without rendering

The kernel is exported as a pure function. Use it for header counters, calendar coloring, status filters, deterministic tests:

```tsx
import {
  deriveTimelineState,
  type TimelineState,
} from "@/registry/components/data/progress-timeline-01";

// Header counter
const activeCount = events.filter(
  (e) => deriveTimelineState(e.regStart, e.regEnd).status === "active",
).length;

// Calendar day-cell coloring
function isWithinWindow(start: string, end: string, day: Date) {
  return deriveTimelineState(start, end, day).status === "active";
}

// Days-left helper for non-rendering contexts
function daysLeft(end: string) {
  return deriveTimelineState(new Date(), end).daysToEnd;
}
```

`TimelineState` shape:

```ts
{
  status: "before" | "active" | "after";
  percent: number;       // 0-100, clamped
  daysToStart: number;   // negative if past
  daysFromStart: number;
  daysToEnd: number;     // negative if past
  totalDays: number;     // always ≥ 1
}
```

Pure JS — works in client + server components, tree-shakeable.

## i18n

The `labels` object accepts strings OR functions for state-driven content:

| Key | Type | Default |
|---|---|---|
| `startLabel` | `ReactNode` | `"Start"` |
| `endLabel` | `ReactNode` | `"End"` |
| `beforeText` | `string \| (state) => ReactNode` | `(s) => \`${s.daysToStart} days until start\`` |
| `activeText` | `string \| (state) => ReactNode` | `(s) => \`${s.daysToEnd} days left\`` |
| `afterText` | `string \| (state) => ReactNode` | `"Ended"` |
| `ariaLabel` | `string` | `"Timeline progress"` |

For full takeover of the center caption, use `renderCenterLabel(state)` which bypasses all three text labels.

## Soft-failure on dates

| Case | Behavior |
|---|---|
| Invalid date (NaN parse) | Falls back to `now` for start; treated as 0-duration; no crash |
| `start > end` | end clamps to start; status flips to `after` immediately when `now > start` |
| `start === end` | totalMs clamps to 1ms; bar reads 0% before, 100% after |
| `now < start` | status = `"before"`; percent = 0 |
| `now ∈ [start, end]` | status = `"active"`; percent ∈ [0, 100] |
| `now > end` | status = `"after"`; percent = 100 |

## Status-conditional colors

The bar fill + marker dot pick up a state-aware color so the visual matches the center label:

| Status | Bar fill | Marker dot |
|---|---|---|
| `before` (not yet started) | `bg-muted-foreground/30` (faint gray) | `bg-muted-foreground` (mid-gray) |
| `active` (currently in progress) | `bg-primary` (signal-lime, default) | `bg-primary` (lime) |
| `after` (completed) | `bg-muted-foreground/40` (mid-gray) | `bg-foreground` (near-black light / near-white dark) |

This is supplementary to the dynamic center label (`labels.beforeText` / `labels.activeText` / `labels.afterText` or `renderCenterLabel`) — color-AND-text per WCAG (color-blind users still see the state encoded in the text). Override either with `barClassName` / `markerClassName` for per-instance theming.

The marker color carries the strongest visual signal of state: muted-gray (waiting) → lime (now) → solid-foreground (done). All three are visually distinct in both light and dark modes, with the after-state marker reading as the most "complete" / archived.

> **Note (v0.1.1 — pre-design-system-owner sign-off):** color picks selected to ensure visible 100%-fill in light + dark themes (`bg-secondary` was rejected because in this codebase it equals `bg-card` at light mode, making the after-state bar near-invisible; `bg-foreground` for the after-marker replaces an earlier identical-to-before pick that lost differentiation). Subject to refinement.

## Accessibility

- Wraps `<section aria-labelledby={headingId}>` when `heading` provided (id from `useId`).
- Inner Radix Progress emits `role="progressbar"` + `aria-valuemin=0` / `aria-valuemax=100` / `aria-valuenow={percent}` automatically.
- `aria-label` on the bar (configurable via `labels.ariaLabel`).
- Marker dot is `aria-hidden="true"` (decorative; the value lives in `aria-valuenow`).
- Heading icon `aria-hidden="true"`.
- Heading levels: `h3` default (timelines are typically nested under a page `h2`); configurable via `headingAs`.

## Performance

- `React.memo` at export — pass stable props for best results.
- Status + percent + days-to/from derivation memoized over `[start, end, now]`.
- Helper kernel is pure JS, no React, no DOM access — usable in server components.

## Migration origin

Ported from kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 159–187. Notable rewrites:

| Source | Pro-comp |
|---|---|
| Hardcoded "assume created 60 days before event" hack to fake a start | Real `start` + `end` props (consumer-supplied) |
| Inline `getTimeProgress()` helper duplicated per page | Public `deriveTimelineState` exported for reuse |
| Hardcoded Turkish heading + labels | `heading` + `labels` props (English defaults) |
| Inline `<Progress>` + manual marker positioning JSX | Sealed component with `marker: "dot" \| "none"` toggle |
| No state announcement | Auto-derived `status` exposed via helper + `statusOverride` escape hatch |
| Hardcoded `bg-card rounded-2xl p-6 border` chrome | `framed: true \| false` toggle |

# progress-timeline-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 159–187 (the "Zaman Çizelgesi" / Time Bar block on the event detail page).

## Problem

Lots of UIs need to communicate "how far along we are between two dates" — registration windows, sprint progress, sales countdowns, project deadlines, course completion windows, fundraising drives. The visual pattern is the same: horizontal progress bar + a marker dot at the current position + 3 captions (start label / dynamic current label / end label). Every project re-implements:
- Computing `(now - start) / (end - start) * 100` correctly with clamping
- The marker dot positioning trick (`left: ${pct}%; transform: translateX(-50%)`)
- The 3-state derivation (`before` / `active` / `after`)
- State-driven center label ("Starts in 5 days" / "In progress" / "Ended 2 days ago")

The kasder source even hacks "assume created 60 days before event" to fake a start date — symptom of not having a real start prop.

Pro-ui has no answer. shadcn `Progress` is a raw bar with no marker, no captions, no time logic.

## In scope

- **Horizontal progress bar** with **marker dot at current %**
- **3-caption row** below: start (left, muted) + center (dynamic, state-driven) + end (right, muted)
- **3-state state machine** auto-derived from `start` / `end` / `now`: `before` / `active` / `after`
- **Public helper kernel** — `deriveTimelineState(start, end, now?)` exported as a pure function for consumers who want to derive state without rendering (header counters, calendar coloring, tests)
- **Dynamic content** — every consumer-visible string overridable via `labels` object; full custom render via `renderCenterLabel(state)`
- **Optional section heading** + `headingIcon` (default `Timer`) + configurable `headingAs`
- **Frame toggle** — `framed: true` default (card chrome `bg-card rounded-2xl p-6 border`) / `false` for embedded contexts
- **Marker variants** — `marker: "dot" | "none"` (toggle off when used inside denser UIs)
- **Escape hatch:** `value?: number` overrides start/end calculation entirely (lets consumers drive the bar from external state — e.g. % course completion that isn't time-based)
- **Soft-failure on dates** — invalid dates clamp to 0/100 without crashing; documented behavior
- **a11y:** `role="progressbar"` + `aria-valuemin`/`max`/`now` + `aria-label`; status states announced via `aria-live="polite"` when consumer drives a controlled `now` that flips state

## Out of scope

- **Vertical timeline** (the connecting-line + dots-at-events pattern) — different component class.
- **Multi-segment timelines** (gantt-style with multiple ranges) — different shape.
- **Editable / draggable marker** — read-only display.
- **Internal `setInterval`** — consumer drives `now` (same pattern as event-card-01).
- **Date formatting** — display labels are plain strings/ReactNode; consumer formats their own dates if they want them in `startLabel` / `endLabel`.

## Target consumers

- Event registration windows (the kasder use case)
- Sprint / project deadline countdowns
- Sales / promotion countdowns ("Sale ends in 3 days")
- Course / module progress windows
- Fundraising / crowdfunding deadline displays
- Application / submission windows (job apps, grant proposals, RFPs)

## Rough API sketch

```ts
<ProgressTimeline01
  start="2026-04-01"
  end="2026-06-30"
  heading="Registration Window"
  labels={{
    startLabel: "Registration opens",
    endLabel: "Event day",
    beforeText: (n) => `Opens in ${n} days`,
    activeText: (state) => `${state.daysToEnd} days left`,
    afterText: "Event has ended",
  }}
/>;
```

5 props are most-used: `start`, `end`, `heading`, `labels`, `framed`. Helper kernel + escape hatches handle the rest.

## Public helper kernel (the dynamicity story)

```ts
import {
  ProgressTimeline01,
  deriveTimelineState,
  type TimelineState,
} from '@ilinxa/progress-timeline-01';

// Use the kernel without rendering:
const activeRegistrations = events.filter(
  (e) => deriveTimelineState(e.regStart, e.regEnd).status === 'active',
).length;

// Calendar day-cell coloring:
const isWithinWindow = (day) =>
  deriveTimelineState(start, end, day).status === 'active';
```

Pure function, no React imports — tree-shakeable, SSR-safe, server-component friendly.

## Example usages

**1. Event registration window (the kasder use case):**

```tsx
<ProgressTimeline01
  start={event.registrationOpens}
  end={event.date}
  heading="Zaman Çizelgesi"
  labels={{
    startLabel: "Kayıt Başlangıcı",
    endLabel: "Etkinlik Günü",
    beforeText: (n) => `${n} gün sonra başlıyor`,
    activeText: (state) => `${state.daysToEnd} gün kaldı`,
    afterText: "Etkinlik Sona Erdi",
  }}
/>
```

**2. Sale countdown banner (no heading, bare):**

```tsx
<ProgressTimeline01
  start={sale.startedAt}
  end={sale.endsAt}
  framed={false}
  marker="none"
/>
```

**3. Course progress with explicit value (escape hatch):**

```tsx
<ProgressTimeline01
  start={course.startDate}
  end={course.endDate}
  value={courseCompletion}              // overrides time-based calc
  heading="Course Progress"
  labels={{
    startLabel: "Module 1",
    endLabel: "Module 12",
    activeText: () => `${courseCompletion}% complete`,
  }}
/>
```

**4. Live-clock host (minute-accurate state flips):**

```tsx
function LiveTimeline({ event }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return <ProgressTimeline01 start={event.start} end={event.end} now={now} />;
}
```

**5. Pure-helper composition (no card render):**

```tsx
import { deriveTimelineState } from '@ilinxa/progress-timeline-01';

function Stat({ events }) {
  const active = events.filter(
    (e) => deriveTimelineState(e.regStart, e.regEnd).status === 'active',
  ).length;
  return <span>{active} active windows</span>;
}
```

## Success criteria

- Renders the kasder Time Bar block verbatim from `start` + `end` props (no "assume 60 days before" hack — real prop-driven).
- Marker dot positions correctly at 0% (flush left), 50%, 100% (flush right via `transform: translateX(-50%)`).
- 3-state derivation is deterministic given same `start` / `end` / `now`.
- Helper `deriveTimelineState` works in both client + server contexts (pure function, no React).
- `framed: false` removes card chrome cleanly.
- `marker: "none"` hides the dot.
- TypeScript: `start` / `end` accept `Date | string`; state union strict.
- a11y: `role="progressbar"` with `aria-valuenow`; semantic heading hierarchy.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean; SSR returns 200 with all demo tabs.

## Open questions

1. **`now` injection — required prop or default to `new Date()`?** **Resolved:** optional, defaults `new Date()`. Same pattern as event-card-01.
2. **`value` escape hatch vs always time-derived?** **Resolved:** include `value` for non-time progress (course %, fundraising goal, etc). When provided, bypasses start/end calculation but `start` / `end` still drive the captions + state.
3. **Marker dot color & size customization** — keep hardcoded (`bg-primary border-4 border-background`) or expose `markerClassName`? **Resolved:** expose `markerClassName` for full Tailwind override; reasonable default ships out of the box.
4. **Should `labels.activeText` / `beforeText` / `afterText` accept strings OR render functions?** **Resolved:** Both. Strings for static defaults, functions for dynamic ("5 days left") — type signature: `string | ((state: TimelineState) => ReactNode)`.
5. **Heading icon — fixed Timer or configurable?** **Resolved:** configurable via `headingIcon` (default `Timer`); pass `null` to omit.

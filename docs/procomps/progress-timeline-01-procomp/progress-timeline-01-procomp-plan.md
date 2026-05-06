# progress-timeline-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`progress-timeline-01-procomp-description.md`](./progress-timeline-01-procomp-description.md) for the what & why.

## Final API

### Public types

```ts
// src/registry/components/data/progress-timeline-01/types.ts

import type { ComponentType, ReactNode } from "react";
import type { TimelineState, TimelineStatus } from "./lib/timeline-state";

export type { TimelineState, TimelineStatus };

export type TimelineLabelText =
  | string
  | ((state: TimelineState) => ReactNode);

export interface ProgressTimeline01Labels {
  /** Default: "Start". Static left-side caption. */
  startLabel?: ReactNode;
  /** Default: "End". Static right-side caption. */
  endLabel?: ReactNode;
  /** Default: state-aware — "{n} days until start". When `now < start`. */
  beforeText?: TimelineLabelText;
  /** Default: state-aware — "In progress". When `now ∈ [start, end]`. */
  activeText?: TimelineLabelText;
  /** Default: state-aware — "Ended". When `now > end`. */
  afterText?: TimelineLabelText;
  /** aria-label on the progress bar. Default: "Timeline progress". */
  ariaLabel?: string;
}

export interface ProgressTimeline01Props {
  /** Start of the timeline window. ISO string or Date. Required. */
  start: Date | string;
  /** End of the timeline window. ISO string or Date. Required. */
  end: Date | string;

  /** Inject "now" for deterministic state (tests, live clocks). Default: new Date() at render. */
  now?: Date;

  /** Escape hatch: explicit 0-100 percentage. Overrides start/end-derived percent (state still derives from dates). */
  value?: number;

  /** Override the auto-derived state. Rare. */
  statusOverride?: TimelineStatus;

  // ─── Heading ─────────────────────────────────────────────────────
  /** Optional section heading. */
  heading?: string;
  /** Heading semantic level. Default: 'h3' (typically nested inside an h2 page section). */
  headingAs?: "h2" | "h3" | "h4";
  /** Heading icon (default Timer). Pass null to omit. */
  headingIcon?: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }> | null;

  // ─── Visual ──────────────────────────────────────────────────────
  /** Wrap in card chrome (`bg-card rounded-2xl p-6 border ...`). Default: true. */
  framed?: boolean;
  /** Marker dot variant. Default: 'dot'. */
  marker?: "dot" | "none";

  /** Localized labels + render-function overrides. */
  labels?: ProgressTimeline01Labels;

  /** Custom center-label renderer — full takeover of the dynamic center caption. Receives derived TimelineState. */
  renderCenterLabel?: (state: TimelineState) => ReactNode;

  // ─── Style overrides ─────────────────────────────────────────────
  /** Override the root <section> classes. */
  className?: string;
  /** Override the heading classes. */
  headingClassName?: string;
  /** Override the bar wrapper classes. */
  barClassName?: string;
  /** Override the marker dot classes. */
  markerClassName?: string;
  /** Override the captions row classes. */
  captionsClassName?: string;
}
```

### Public helper kernel

```ts
// src/registry/components/data/progress-timeline-01/lib/timeline-state.ts

export type TimelineStatus = "before" | "active" | "after";

export interface TimelineState {
  /** Derived state — time-window position. */
  status: TimelineStatus;
  /** Percent elapsed (0-100), clamped. */
  percent: number;
  /** Days until start (negative if start is past). */
  daysToStart: number;
  /** Days from start (negative if start is future). */
  daysFromStart: number;
  /** Days to end (negative if end is past). */
  daysToEnd: number;
  /** Total days in the window (always positive; clamped to 1 minimum). */
  totalDays: number;
}

/**
 * Pure function. Derives timeline state from start + end + an optional `now`.
 * Invalid dates clamp gracefully; out-of-window times return 0% / 100%.
 */
export function deriveTimelineState(
  start: Date | string,
  end: Date | string,
  now?: Date,
): TimelineState;
```

### Default labels

```ts
export const DEFAULT_PROGRESS_TIMELINE_LABELS: Required<
  Omit<ProgressTimeline01Labels, "beforeText" | "activeText" | "afterText">
> & {
  beforeText: TimelineLabelText;
  activeText: TimelineLabelText;
  afterText: TimelineLabelText;
} = {
  startLabel: "Start",
  endLabel: "End",
  beforeText: (state) =>
    `${state.daysToStart} day${state.daysToStart === 1 ? "" : "s"} until start`,
  activeText: (state) =>
    `${state.daysToEnd} day${state.daysToEnd === 1 ? "" : "s"} left`,
  afterText: "Ended",
  ariaLabel: "Timeline progress",
};
```

### Exported names

```ts
// index.ts
export { default as ProgressTimeline01 } from "./progress-timeline-01";
export type {
  ProgressTimeline01Props,
  ProgressTimeline01Labels,
  TimelineLabelText,
  TimelineStatus,
  TimelineState,
} from "./types";
export { DEFAULT_PROGRESS_TIMELINE_LABELS } from "./types";
export { deriveTimelineState } from "./lib/timeline-state";
export { meta } from "./meta";
```

## File-by-file plan

8 files. Sealed-folder.

```
src/registry/components/data/progress-timeline-01/
├── progress-timeline-01.tsx       # 1 — root
├── lib/
│   └── timeline-state.ts          # 2 — public kernel
├── types.ts                       # 3
├── dummy-data.ts                  # 4
├── demo.tsx                       # 5
├── usage.tsx                      # 6
├── meta.ts                        # 7
└── index.ts                       # 8
```

### 1. `progress-timeline-01.tsx` — root

- `"use client"` directive.
- `React.memo` at export.
- Resolves defaults (labels merge, framed default true, marker default "dot", headingAs default "h3", headingIcon default Timer).
- Computes `headingId` via `useId` (only used when heading provided).
- Derives state once via `useMemo([start, end, now])` calling `deriveTimelineState`.
- `effectivePercent = value ?? state.percent` (escape hatch).
- `effectiveStatus = statusOverride ?? state.status`.
- Resolves center label:
  ```ts
  const labelMap = {
    before: labels.beforeText,
    active: labels.activeText,
    after: labels.afterText,
  };
  const centerLabel = renderCenterLabel
    ? renderCenterLabel(state)
    : typeof labelMap[effectiveStatus] === "function"
      ? labelMap[effectiveStatus](state)
      : labelMap[effectiveStatus];
  ```
- Renders:
  ```tsx
  <section
    aria-labelledby={heading ? headingId : undefined}
    className={cn(
      framed && "bg-card rounded-2xl p-6 border border-border/50",
      className,
    )}
  >
    {heading && (
      <HeadingTag
        id={headingId}
        className={cn("text-lg font-semibold text-foreground mb-4 flex items-center gap-2", headingClassName)}
      >
        {HeadingIcon && <HeadingIcon aria-hidden="true" className="w-5 h-5 text-primary" />}
        {heading}
      </HeadingTag>
    )}

    <div className="space-y-4">
      <div className={cn("relative", barClassName)}>
        <Progress
          value={effectivePercent}
          className="h-4 rounded-full"
          aria-label={labels.ariaLabel}
        />
        {marker === "dot" && (
          <div
            aria-hidden="true"
            className="absolute top-0 h-4 flex items-center justify-center pointer-events-none"
            style={{ left: `${effectivePercent}%`, transform: "translateX(-50%)" }}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full bg-primary border-4 border-background shadow-lg",
                markerClassName,
              )}
            />
          </div>
        )}
      </div>

      <div className={cn("flex justify-between text-sm", captionsClassName)}>
        <span className="text-muted-foreground">{labels.startLabel}</span>
        <span className="text-foreground font-medium">{centerLabel}</span>
        <span className="text-muted-foreground">{labels.endLabel}</span>
      </div>
    </div>
  </section>
  ```

### 2. `lib/timeline-state.ts` — public kernel

```ts
export type TimelineStatus = "before" | "active" | "after";

export interface TimelineState { /* as above */ }

export function deriveTimelineState(
  start: Date | string,
  end: Date | string,
  now: Date = new Date(),
): TimelineState {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Clamp invalid / inverted dates
  const validStart = isNaN(startDate.getTime()) ? now : startDate;
  const validEnd = isNaN(endDate.getTime())
    ? validStart
    : endDate < validStart
      ? validStart
      : endDate;

  const totalMs = Math.max(1, validEnd.getTime() - validStart.getTime());
  const elapsedMs = now.getTime() - validStart.getTime();
  const percent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysToStart = Math.ceil((validStart.getTime() - now.getTime()) / MS_PER_DAY);
  const daysFromStart = Math.floor((now.getTime() - validStart.getTime()) / MS_PER_DAY);
  const daysToEnd = Math.ceil((validEnd.getTime() - now.getTime()) / MS_PER_DAY);
  const totalDays = Math.max(1, Math.ceil(totalMs / MS_PER_DAY));

  let status: TimelineStatus;
  if (now < validStart) status = "before";
  else if (now > validEnd) status = "after";
  else status = "active";

  return { status, percent, daysToStart, daysFromStart, daysToEnd, totalDays };
}
```

Pure JS, no React imports. Tree-shakeable, SSR-safe, server-component friendly.

### 3. `types.ts`

All public types as shown above. `TimelineState` + `TimelineStatus` re-exported from `lib/timeline-state`.

### 4. `dummy-data.ts`

Fixed `dummyNow` constant + 3 timeline shapes covering all 3 states:

```ts
export const dummyNow = new Date("2026-06-01T12:00:00Z");

export const dummyTimelineActive = {
  start: "2026-04-01",
  end: "2026-06-30",   // active state — ~67% through
};

export const dummyTimelineBefore = {
  start: "2026-08-01",
  end: "2026-09-15",
};

export const dummyTimelineAfter = {
  start: "2026-03-01",
  end: "2026-05-15",
};
```

### 5. `demo.tsx`

5-tab demo, shadcn `Tabs`:

1. **Default (TR)** — kasder verbatim: heading "Zaman Çizelgesi", Timer icon, Turkish labels, active state showing "29 gün kaldı"
2. **3 states** — 3 timelines stacked: before / active / after, all using English defaults
3. **Bare** — `framed={false}`, `marker="none"`, no heading — for embedded contexts (banner, dashboard tile)
4. **Custom render** — `renderCenterLabel` displaying a percent number AND days-left (e.g. "67% — 29 days left")
5. **Course progress (`value` escape hatch)** — `value={42}` overrides time-derived percent; demonstrates non-time use case

### 6. `usage.tsx`

Code blocks: minimal usage, helper kernel without rendering, custom labels (functions vs strings), `value` escape hatch, live-clock host pattern, soft-failure on invalid dates.

### 7. `meta.ts`

```ts
export const meta: ComponentMeta = {
  slug: "progress-timeline-01",
  name: "Progress Timeline 01",
  category: "data",
  description:
    "Horizontal progress bar with marker dot at current % + 3-caption row (start / dynamic state-aware center / end). Auto-derives 3-state machine (before/active/after) from start + end + now. Public helper kernel for status reuse outside the card.",
  context:
    "Use for any time-bound progress display — registration windows, sprints, sales countdowns, course completion windows, fundraising deadlines. Public helper `deriveTimelineState` exported alongside so consumers can derive state without rendering. Migration origin: kasder events/[id]/page.tsx Time Bar block.",
  features: [
    "Horizontal progress bar with marker dot at current %",
    "3-state state machine — before / active / after",
    "Public helper kernel — deriveTimelineState pure function",
    "Dynamic center label — string OR (state) => ReactNode",
    "Frame toggle (framed/bare) + marker toggle (dot/none)",
    "Optional heading with configurable level + icon",
    "value escape hatch for non-time-based progress",
    "now injection for deterministic / live-clock hosts",
    "statusOverride for preview / what-if states",
    "i18n via labels object (5 keys: start/end/before/active/after + aria-label)",
    "WCAG — Radix Progress role=progressbar + aria-valuenow",
  ],
  tags: ["progress-timeline-01", "progress", "timeline", "countdown", "events"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",
  author: { name: "ilinxa" },
  dependencies: { shadcn: ["progress", "tabs"], npm: { "lucide-react": "^0.x" }, internal: [] },
  related: ["event-card-01", "schedule-list-01"],
};
```

### 8. `index.ts`

Public exports as shown above.

## Dependencies

### Internal (pro-ui)

- `@/components/ui/progress` — already installed (event-card-01 was first user)
- `@/lib/utils` — `cn()`

### NPM

- `react` — runtime + types
- `lucide-react` — `Timer` icon for default heading

### Forbidden

- `next/*`, `framer-motion`, date library

## Composition pattern

Headless wrapping over a presentational layout. No parts file — single root component with composition contained inline (small enough that splitting would over-engineer). Helper kernel in `lib/`.

## Edge cases

| Case | Behavior |
|---|---|
| `start === end` | totalMs clamps to 1; percent renders as 0% before, 100% after, doesn't crash |
| `start > end` | end gets clamped to start (effectively 0 duration); status flips to `after` immediately when now > start |
| Invalid dates (NaN) | Falls back to `now` for start; treats as 0 duration; percent = 0; renders without crash |
| `now` not provided | Defaults to `new Date()` at render; status derives normally |
| `now < start` | status = "before"; percent = 0; daysToStart positive |
| `now ∈ [start, end]` | status = "active"; percent ∈ [0, 100] |
| `now > end` | status = "after"; percent = 100; daysToEnd negative |
| `value` provided | Bar percent uses `value`; state derivation still uses dates (so center label still time-aware) |
| `statusOverride` provided | Wins over derived status; center label uses overridden status's labelMap entry |
| `marker: "none"` | Marker dot omitted; bar still renders |
| `framed: false` | Card chrome dropped; bar + captions render naked |
| `heading` missing | Heading + icon omitted; section has no `aria-labelledby` |
| `headingIcon: null` | Icon omitted; heading still renders |
| Reduced motion | No transforms / pulses needed in this component — Progress's value-change animation is shadcn default; `motion-safe:` not strictly required but applied if any future hover added |

## Accessibility

- Wraps `<section aria-labelledby={headingId}>` when heading is supplied; heading id from `useId`.
- Inner `Progress` (Radix) renders `role="progressbar"` with `aria-valuemin=0` / `aria-valuemax=100` / `aria-valuenow={percent}` automatically.
- `aria-label={labels.ariaLabel}` on the bar (default "Timeline progress").
- Marker dot is `aria-hidden="true"` (decorative; the value is in `aria-valuenow`).
- Heading icon `aria-hidden="true"`.
- Captions row uses `<span>` (purely textual) — screen readers read in DOM order: start label → center text → end label.
- Heading levels: `h3` default (cards typically nested under page `h2`); configurable via `headingAs`.

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (only pre-existing rich-card warning)
- [ ] `pnpm build` clean — `/components/progress-timeline-01` prerendered
- [ ] SSR returns 200 with all 5 demo tab triggers
- [ ] `/components` index lists the new entry
- [ ] Marker dot positions visually correctly at 0% / 50% / 100%
- [ ] All 3 states render different center labels in the "3 states" demo tab
- [ ] Helper-only import works: `import { deriveTimelineState } from "@/registry/components/data/progress-timeline-01"` typechecks without pulling React imports

## Risks & alternatives

### Risk 1: Marker positioned at 0% / 100% extends outside the bar

The marker dot is `w-6 h-6` centered via `transform: translateX(-50%)`. At 0%, half the dot extends left of the bar; at 100%, half extends right. **Mitigation:** the dot is decorative (`aria-hidden`); slight overflow is the design (kasder source). If consumers want it clipped, they can wrap in `overflow-hidden`. Document if real demand surfaces.

### Risk 2: Helper-export API stability

`deriveTimelineState` becomes a public contract. **Mitigation:** signature is minimal (`(start, end, now?) => TimelineState`); the returned shape is documented + type-exported. Future changes append fields; never remove.

### Alternatives considered

1. **Drop the marker dot, use just the bar's filled portion** — rejected; the dot is the kasder source's signature visual element + helps eye-track current position vs total range.
2. **Bake all timing logic into the component (no public helper)** — rejected (dynamicity priority); helper enables consumer reuse for stats, calendars, tests.
3. **Vertical timeline variant in v0.1** — rejected; different shape entirely, defer to a separate component.
4. **Multi-segment timelines (gantt-style)** — rejected; out of scope for v0.1, different problem class.
5. **Internal `setInterval` for live updates** — rejected (consumer drives `now`); same call as event-card-01.

## Open follow-ups (post v0.1)

- v0.2: vertical orientation variant (`orientation: "horizontal" | "vertical"`)
- v0.2: tick marks at custom positions (e.g. milestone markers along the bar)
- v0.2: animated marker on `now`-change for live-clock hosts

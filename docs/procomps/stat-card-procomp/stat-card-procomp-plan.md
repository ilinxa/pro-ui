# stat-card — procomp plan

> Stage 2: how. The implementation contract.
>
> **Predecessor:** [`stat-card-procomp-description.md`](./stat-card-procomp-description.md), signed off at commit `59b44fd` ("ship it" — all 8 open-question recommendations accepted; 3 audit fixes applied: default `delta.format` = Intl percent / `polarity` → `betterIsHigher` / no public `direction` prop).

## Final API

### Public types

```ts
// types.ts

import type { ComponentType, ElementType, MouseEvent, ReactNode } from "react";

/** Visual variant. Default: 'default'. */
export type StatCardVariant = "default" | "compact" | "detailed";

/** Lucide-style icon prop. */
export type StatCardIcon = ComponentType<{ className?: string }>;

/** Position for the optional leading/trailing icon. Default: 'leading'. */
export type StatCardIconPosition = "leading" | "trailing";

/** Delta payload — change since some prior period. Object-shape; F-cross-12 lessons applied. */
export interface StatCardDelta {
  /**
   * Signed number representing the change. **Convention: a fraction in 0–1 range
   * representing a percentage** (`0.124` = +12.4%, `-0.08` = −8.0%). The default
   * `format` callback assumes this convention and renders via `Intl.NumberFormat`
   * with `style: "percent"`. For absolute counts ("+1,240 users") or other units,
   * override `format` (see below).
   */
  value: number;
  /**
   * Custom formatter. Default: locale-aware
   * `Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" })`
   * → produces `+12.4%` / `−8.0%` / `0%`. Override for non-percentage units.
   */
  format?: (value: number) => string;
  /**
   * "Is up good?" — default `true`. Set `false` for cost / error metrics where ↑ is bad
   * (colors the upward delta red instead of green).
   */
  betterIsHigher?: boolean;
  /**
   * Optional period label rendered after the formatted delta value
   * (e.g. "vs last 30 days", "since Tuesday", "from peak").
   * ReactNode — consumer owns the copy. Default: `labels.deltaPeriod` ("last period").
   */
  period?: ReactNode;
}

/** Localized labels — defaults English. */
export interface StatCardLabels {
  /** Default: 'vs'. Rendered between formatted delta value and period text. */
  deltaPrefix?: ReactNode;
  /** Default: 'last period'. Used as `delta.period` fallback when none supplied. */
  deltaPeriod?: ReactNode;
  /** Default: 'Loading metric…'. Visually-hidden announcement on the loading skeleton. */
  loadingLabel?: ReactNode;
  /** Default: 'increase'. Visually-hidden screen-reader text for positive deltas. */
  increaseLabel?: ReactNode;
  /** Default: 'decrease'. Visually-hidden screen-reader text for negative deltas. */
  decreaseLabel?: ReactNode;
  /** Default: '—'. Rendered at value position when `value === undefined`. */
  emptyValueLabel?: ReactNode;
}

/** Render-slot context for `renderValue`. */
export interface StatCardValueContext {
  value: number | string;
  /** True when this is the value rendered inside the loading skeleton (consumer-side rare). */
  loading: boolean;
}

/** Render-slot context for `renderTrend` (escape hatch for non-default chart shapes). */
export interface StatCardTrendContext {
  data: ReadonlyArray<number>;
  /** Computed direction for the SR badge — derived from delta.value sign, NOT from trend. */
  variant: StatCardVariant;
}

export interface StatCardProps {
  // ─── Required ────────────────────────────────────────────────────
  /** Big number. Pass primitive (formatted via `formatValue`) or any ReactNode via `renderValue`. */
  value: number | string | undefined;
  /** What this number is. Required. */
  label: ReactNode;

  // ─── Variant ─────────────────────────────────────────────────────
  /** Visual variant. Default: 'default'. */
  variant?: StatCardVariant;

  // ─── Delta ───────────────────────────────────────────────────────
  /** Optional delta payload. Absent → delta row not rendered. */
  delta?: StatCardDelta;

  // ─── Trend / sparkline ───────────────────────────────────────────
  /**
   * Sparkline data — equal-spaced numeric values. Default rendering: pure-SVG
   * single-line chart (no charting peer dep). Empty array or single point → no
   * chart (graceful skip). Cap at 100 points (sampled if more).
   */
  trend?: ReadonlyArray<number>;
  /** Full-takeover render slot for trend visualization (e.g., bars, dual-axis). Receives raw data. */
  renderTrend?: (ctx: StatCardTrendContext) => ReactNode;

  // ─── Icon ────────────────────────────────────────────────────────
  /** Optional decorative icon. Lucide-style component. */
  icon?: StatCardIcon;
  /** Position for the icon. Default: 'leading'. */
  iconPosition?: StatCardIconPosition;

  // ─── Formatters / slots ──────────────────────────────────────────
  /** Format the big value for display. Default: `String(value)` (no formatting). */
  formatValue?: (value: number | string) => ReactNode;
  /** Full-takeover slot for the value cell (overrides `formatValue`). */
  renderValue?: (ctx: StatCardValueContext) => ReactNode;

  // ─── Linking (overlay-link pattern) ──────────────────────────────
  /** URL the card links to. Pairs with `linkComponent`. */
  href?: string;
  /** Element used for the link wrapper. Default: 'a'. */
  linkComponent?: ElementType;
  /**
   * Click handler — F-cross-12-shape (object). Fired before navigation if `href` is also set.
   */
  onClick?: (args: { event: MouseEvent }) => void;

  // ─── Loading / empty states ──────────────────────────────────────
  /** When true, renders a skeleton at the same shape as the loaded card. */
  loading?: boolean;

  // ─── i18n ────────────────────────────────────────────────────────
  labels?: StatCardLabels;

  // ─── Theming / overrides ─────────────────────────────────────────
  /** Override classes for the root <dl> / <a>. */
  className?: string;
  /** Override classes for the value cell. */
  valueClassName?: string;
  /** Override classes for the label cell. */
  labelClassName?: string;
  /** Override classes for the delta row. */
  deltaClassName?: string;

  // ─── Accessibility ───────────────────────────────────────────────
  /**
   * Override the link's accessible name. Default: derived from
   * `${label}: ${formatted-value}`. Only used when `href` is set.
   */
  ariaLabel?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_STAT_CARD_LABELS: Required<StatCardLabels> = {
  deltaPrefix: "vs",
  deltaPeriod: "last period",
  loadingLabel: "Loading metric…",
  increaseLabel: "increase",
  decreaseLabel: "decrease",
  emptyValueLabel: "—",
};
```

### Public exports from `index.ts`

```ts
export { StatCard, default } from "./stat-card";
export { StatCardSparkline } from "./parts/sparkline";
export { defaultDeltaFormat } from "./lib/format-default";
export { DEFAULT_STAT_CARD_LABELS } from "./types";
export type {
  StatCardVariant,
  StatCardLabels,
  StatCardProps,
  StatCardDelta,
  StatCardIcon,
  StatCardIconPosition,
  StatCardTrendContext,
  StatCardValueContext,
} from "./types";
// NOTE: `meta` is intentionally NOT re-exported here — it's docs-site only,
// excluded from registry shipments per the post-Phase-7 cleanup.
```

### Sub-export

`<StatCardSparkline>` is a **sibling RSC-compatible component** consumers can use standalone (e.g., to put a sparkline in a non-stat-card context). Pure SVG, no charting peer dep. Same data shape as `trend` prop.

```ts
export interface StatCardSparklineProps {
  data: ReadonlyArray<number>;
  /** Default: 80 (px). Width auto-fills container if not set. */
  height?: number;
  className?: string;
  /** Default: `currentColor` (inherits parent text color via Tailwind `text-primary` etc.). Override per consumer. */
  strokeColor?: string;
  /** Override path stroke width. Default: 1.5. */
  strokeWidth?: number;
}
```

## File-by-file plan

```
src/registry/components/data/stat-card/
├── stat-card.tsx               ← main component (variant dispatch)
├── parts/
│   └── sparkline.tsx              ← <StatCardSparkline> — pure SVG; sibling export
├── lib/
│   └── format-default.ts          ← defaultDeltaFormat (Intl percent)
├── types.ts                       ← all type definitions + DEFAULT_STAT_CARD_LABELS
├── dummy-data.ts                  ← fixtures: revenue / errorRate / activeUsers / latency / signups
├── demo.tsx                       ← tabs: Default / Compact / Detailed / Loading / Empty / Polarity matrix
├── usage.tsx                      ← consumer-facing prose + code blocks
├── meta.ts                        ← metadata
└── index.ts                       ← barrel (no meta export)
```

### `stat-card.tsx` — main component

Single function component (~150–200 LOC). No memoization at the React.memo level — React Compiler handles it.

Variant dispatch is internal: a `switch (variant)` on the root layout. The three variants share most internal logic (delta computation, formatters, ARIA wiring); they differ only in the rendered DOM tree (size, ordering, sparkline presence).

Internal structure:

1. Resolve `labels` (merge with defaults via simple destructure — no useMemo; React Compiler memoizes).
2. Resolve `formatValue` / `renderValue` priority.
3. Compute delta semantics if `delta` is supplied:
   - `formattedValue = (delta.format ?? defaultDeltaFormat)(delta.value)`
   - `direction = delta.value > 0 ? "up" : delta.value < 0 ? "down" : "neutral"` (internal only — not exposed)
   - `colorTone = deriveTone(direction, delta.betterIsHigher ?? true)` → `"good" | "bad" | "neutral"`
   - `srLabel = direction === "up" ? labels.increaseLabel : direction === "down" ? labels.decreaseLabel : null`
4. Render based on `variant`:
   - `default` — Icon (leading) | Label / Value / Delta-row | Sparkline (if trend)
   - `compact` — Icon (leading) | Label / Value / Delta-row (no sparkline)
   - `detailed` — Icon (leading) | Label / BIG Value / Delta-row + secondary stats slot / Sparkline (mandatory)
5. Wrap in `<dl>` (no href) or overlay-link pattern (`<dl>` + invisible `<linkComponent>` covering it) when `href` provided.
6. `loading` short-circuits to skeleton render path.
7. `value === undefined && !loading` renders `labels.emptyValueLabel` at value position with muted styling.

### `parts/sparkline.tsx` — pure SVG sparkline

Pure-function component, ~30–40 LOC including aria + viewbox math. No state, no client.

Algorithm:
1. Normalize data to `[0, 1]` range via `(v - min) / (max - min)` per point.
2. Map to SVG path: `M ${x0} ${y0} L ${x1} ${y1} ...`.
3. Render: `<svg viewBox="0 0 W H" aria-hidden="true"><path d={path} stroke={strokeColor} fill="none" stroke-linejoin="round" stroke-linecap="round" /></svg>`.
4. Default `strokeColor: "currentColor"` so it inherits from the parent's color (reasonable default for the in-card use case).
5. Cap at 100 points; sample uniformly if `data.length > 100` (pre-render decision; cheap).
6. Empty data (`length === 0` or `length === 1` ALL same value, leading to NaN division) → return `null`.

Standalone usage:
```tsx
<StatCardSparkline data={[10, 14, 9, 15, 21]} className="text-primary h-8 w-24" />
```

### `lib/format-default.ts` — default formatters

```ts
const enPercentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/** Default delta formatter — convention: value is a fraction (0.124 = 12.4%). */
export function defaultDeltaFormat(value: number): string {
  return enPercentFormatter.format(value);
}
```

Single export. Consumer can import directly for composition (e.g., when wrapping the formatter to add a custom unit suffix).

### `types.ts` — type definitions

All types from the "Final API" section above. Plus `DEFAULT_STAT_CARD_LABELS` (a `Required<StatCardLabels>` constant).

### `dummy-data.ts` — fixtures

5 scenarios for the demo tabs:

```ts
export const STAT_CARD_DUMMY_REVENUE = {
  value: 12431,
  label: "Revenue this month",
  formatValue: ... ,
  delta: { value: 0.124 },
  trend: [8200, 8800, 9100, 10200, 10900, 11500, 12100, 12431],
  // icon: lucide DollarSign in demo (icon imports stay in demo.tsx — meta.ts allowlist)
};

export const STAT_CARD_DUMMY_ERROR_RATE = {
  value: 0.42,
  label: "Error rate (last 24h)",
  delta: { value: 0.08, betterIsHigher: false },
  trend: [0.31, 0.34, 0.36, 0.39, 0.41, 0.42, 0.42],
};

export const STAT_CARD_DUMMY_ACTIVE_USERS = {
  value: 1234,
  label: "Active users",
};

export const STAT_CARD_DUMMY_LATENCY = {
  value: 42.7,
  label: "Average response time",
  delta: { value: -0.08, betterIsHigher: false },
};

export const STAT_CARD_DUMMY_SIGNUPS = {
  value: 42138,
  label: "New signups this week",
  delta: {
    value: 1240,
    format: (v: number) => v.toLocaleString(undefined, { signDisplay: "exceptZero" }),
  },
};
```

### `demo.tsx` — Tabs (`shadcn/ui` Tabs)

```
- Default          → 4-card strip (revenue / errorRate / activeUsers / latency) in grid-cols-4
- Compact          → 3 sidebar widgets stacked, no sparklines
- Detailed         → 2 hero cards (revenue + uptime fixture) with icon + sparkline + secondary
- Loading          → 4 cards in loading=true state; toggle button to flip loading
- Empty            → value=undefined demo; shows "—" muted
- Color logic matrix → 5-card grid: positive×true, positive×false, negative×true, negative×false, zero×any (zero renders neutral regardless of betterIsHigher)
- Custom value     → renderValue showing the unit-superscript pattern
- Sparkline only   → standalone <StatCardSparkline> usage
- i18n             → labels override demo (Turkish: "geçen ay'a kıyasla" etc.)
```

### `usage.tsx` — written guidance

Standard pro-ui usage.tsx shape: 5–6 prose sections each with a copy-pasteable code block. Sections:

- **Quick start** — minimal usage (value + label + delta).
- **Variants** — when to pick default / compact / detailed.
- **Delta polarity** — `betterIsHigher` examples; the percent default convention.
- **Custom value rendering** — `renderValue` for unit-superscripts / tooltips / etc.
- **Sparkline** — built-in trend prop AND standalone `<StatCardSparkline>`.
- **Loading + empty** — when to use which.
- **i18n** — labels override.

Imports from `@/components/<slug>/*` paths (consumer-side; not registry-side) — locked by F-cross-06.

### `meta.ts` — metadata

```ts
export const meta: ComponentMeta = {
  slug: "stat-card",
  name: "Stat Card 01",
  category: "data",
  description: "Single-metric dashboard widget — value + label + delta + sparkline. ...",
  context: "Use anywhere you need to surface a single number with optional trend context. ...",
  features: [
    "3 variants — default / compact / detailed",
    "Object-shape delta callback (F-cross-12-correct from day one)",
    "betterIsHigher boolean for cost/error semantics",
    "Built-in pure-SVG sparkline (no charting peer dep)",
    "<StatCardSparkline> sibling export for standalone use",
    "Default Intl percent formatter (locale-aware)",
    "Loading state with shape-matched skeleton",
    "Empty state ('—' at value position)",
    "<dl> root for native screen-reader label-value pairs",
    "Polymorphic root via linkComponent + href",
    "renderValue + renderTrend escape hatches",
    "WCAG 2.1 AA — sr-only delta semantic, aria-hidden sparkline, focus-visible ring on link",
  ],
  tags: ["stat-card", "metric", "kpi", "dashboard", "sparkline", "delta", "card"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-09",
  updatedAt: "2026-05-09",
  author: { name: "ilinxa" },
  dependencies: {
    shadcn: ["skeleton"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },
  related: ["data-table", "news-card"],
};
```

`shadcn` includes only `skeleton` (for the loading state). No internal deps; no charting library.

### `index.ts` — barrel

Per the post-Phase-7 rule (no `meta` re-export):

```ts
export { StatCard, default } from "./stat-card";
export { StatCardSparkline } from "./parts/sparkline";
export { defaultDeltaFormat } from "./lib/format-default";
export { DEFAULT_STAT_CARD_LABELS } from "./types";
export type {
  StatCardVariant,
  StatCardLabels,
  StatCardProps,
  StatCardDelta,
  StatCardIcon,
  StatCardIconPosition,
  StatCardTrendContext,
  StatCardValueContext,
} from "./types";
```

## Dependencies

| Type | Item | Purpose |
|---|---|---|
| **shadcn primitive** | `skeleton` | Loading-state skeleton blocks |
| **npm peer** | `lucide-react@^1.11.0` | Icon prop type only — actual icons supplied by consumer |

No charting library. No internal registry-component composition. Sparkline is built from raw SVG in `parts/sparkline.tsx`.

## Composition pattern

- **Variant dispatch via single prop** (`variant?: "default" | "compact" | "detailed"`) rather than separate components. Consumers can pick variant dynamically; no per-variant API surface duplication.
- **Slot pattern** for `renderValue` and `renderTrend` — full-takeover escape hatches; default behavior is opinionated.
- **Polymorphic root** via `linkComponent + href`. When both supplied: overlay-link pattern (transparent `<linkComponent>` covers the `<dl>`, intercepting clicks while letting nested elements stay reachable). When neither supplied: passive `<dl>` with no focus ring.
- **Headless+presentation NOT used.** State is purely controlled (loading from consumer); there is no headless API to extract.
- **Sub-component sibling export** (`StatCardSparkline`) for the sparkline part — pattern from engagement-bar's `EngagementHeartBurst`. Consumers wanting just a sparkline outside a card import it directly.
- **Render-prop signatures use object shape** (per F-cross-12): `renderValue({ value, loading })`, `renderTrend({ data, variant })`.

## Client vs server

**No `"use client"` directive.** Component is pure-render — no useState, no useEffect, no event handlers (other than the consumer-supplied `onClick` callback wired through to the underlying `<a>` element via prop forwarding, which doesn't require client context).

Sparkline is pure SVG — no client.

`useId` for ARIA wiring is a React 18+ server-renderable hook — no client needed.

If consumer passes a `linkComponent` that itself requires client (e.g., `next/link`'s prefetch behavior), that's handled by the consumer's own component tree — stat-card itself stays server-renderable.

## Edge cases

| Case | Behavior |
|---|---|
| `value === undefined`, `loading === false` | Render `labels.emptyValueLabel` (default `"—"`) at value position, muted-foreground styling, same height as a real value |
| `value === undefined`, `loading === true` | Skeleton path; `loading` wins |
| `delta` absent | Delta row not rendered |
| `delta.value === 0` | Render formatted "0%" with neutral color (no green/red); no up/down arrow; no sr-only increase/decrease label |
| `trend` absent OR `trend.length < 2` | Sparkline not rendered |
| `trend.length > 100` | Sample uniformly down to 100 points before rendering |
| `trend` data is constant (all values equal) | Render a horizontal line at center (handle min === max case to avoid NaN) |
| `icon` absent | No icon rendered; layout adapts (no leading/trailing whitespace) |
| `href` absent + `linkComponent` provided | Treat as no link (don't render bare `<linkComponent>` without href) |
| `href` provided + `linkComponent` absent | Render `<a href>` directly |
| Long `label` (50+ chars) | Truncate at 2 lines via `line-clamp-2`; `<dt>` keeps full text for screen readers |
| Long `value` (15+ chars) | Allow horizontal scroll within the value cell? No — clamp at 1 line via `truncate`; consumer should use `formatValue` to abbreviate ("$1.2M" not "$1,234,567.89") |
| RTL | Sparkline does NOT flip (chronological direction is universal); icon position auto-flips via Tailwind logical properties (or component renders `iconPosition` aware of `dir`); delta arrow flips |
| Mobile (narrow) | `default` variant fits in `min-w-[200px]`; consumer responsible for grid breakpoints |
| Click while `loading` | onClick still fires (consumer's choice — they may want to log loading-state clicks); link navigation works |
| Click handler throws | Bubbles up to consumer; no internal try/catch |

## Accessibility

### Markup shape

```html
<dl class="...">  <!-- or wrapped in <a> for the linked variant -->
  <span aria-hidden="true">{icon}</span>  <!-- decorative -->
  <dt class="label-cell">{label}</dt>
  <dd class="value-cell">{formattedValue}</dd>
  <!-- delta row -->
  <dd class="delta-row">
    <span aria-hidden="true">{arrow}</span>
    <span>{formattedDelta}</span>
    <span class="sr-only">{labels.increaseLabel | labels.decreaseLabel}</span>
    <span aria-hidden="true">{labels.deltaPrefix} {delta.period ?? labels.deltaPeriod}</span>
  </dd>
  <!-- sparkline -->
  <div aria-hidden="true">{sparkline}</div>
</dl>
```

### Specific behaviors

- **`<dl>` root** — screen readers announce label-value pairs natively (`label`: `value`). The icon is `aria-hidden`; semantic meaning lives in the label text.
- **Delta row** — visual arrow + formatted number + sr-only increase/decrease label + period text (visible). SR experience: "Revenue this month: $12,431. 12.4% increase, vs last 30 days."
- **Sparkline** — `aria-hidden="true"`. The trend visualization is decorative; the meaningful summary is the delta value. (Aspirational v0.2: optional `aria-label` on the sparkline summarizing trend direction.)
- **Focus-visible ring** — only when the card is linked (`href` provided). Pure-display cards have no interactive surface and no focus ring.
- **Loading state** — `aria-busy="true"` on the root; `<span class="sr-only">{labels.loadingLabel}</span>` so SR users hear "Loading metric…" rather than a silent skeleton.
- **Empty state** — `<dd>` contains `labels.emptyValueLabel` (default "—"). SR says "label: dash" — semantic enough; consumer can override via `labels.emptyValueLabel` if more verbose ("no data") preferred.

### Keyboard behavior

- Linked card: full card is a single tab stop; Enter/Space activates the link.
- Pure-display card: not focusable (no tab stop).
- No internal keyboard interactions (no expand/collapse, no drag).

## Verification checklist (mirrors component-guide §13)

This is the same checklist `docs/component-guide.md §13` enumerates; reproduced here as the implementation contract — every box must be `[x]` before this component graduates GATE 3 (the v0.1.0 spot-check review).

### Build + correctness
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm validate:meta-deps` reports `37 / 37 clean` (count goes up by 1 with this addition)
- [ ] `pnpm dev` shows the component at `/components/stat-card` with no console warnings
- [ ] `pnpm build` succeeds (offline-friendly post F-cross-04)

### Content + presentation
- [ ] All 9 demo tabs render correctly in light + dark
- [ ] No layout shift (CLS < 0.05) when `loading: true → false`
- [ ] Color logic matrix tab shows 5 visually-distinct cells (positive×true / positive×false / negative×true / negative×false / zero)
- [ ] Sparkline renders cleanly at 1 / 2 / 8 / 50 / 200 (sampled to 100) data points

### Conventions
- [ ] `meta.slug === "stat-card"` matches folder + URL
- [ ] No `meta` re-export from `index.ts` (post-Phase-7 rule)
- [ ] No positional callbacks (F-cross-12 lessons applied)
- [ ] No `text-white` over the lime gradient (no lime gradient in this component anyway, but grep is part of the discipline)

### Registry distribution
- [ ] Added to `registry.json` — base + `stat-card-fixtures` items
- [ ] Files list excludes `demo.tsx`, `usage.tsx`, `meta.ts`
- [ ] All file `target` values prefixed with `components/stat-card/`

### Component readiness review (GATE 3)
- [ ] Spot-check review file authored at `docs/procomps/stat-card-procomp/reviews/<DATE>-v0.1.0-spotcheck.md`
- [ ] Smoke harness pass — `pnpm dlx shadcn add @ilinxa/stat-card` succeeds; consumer-side `pnpm tsc --noEmit` clean (F-cross-11 path b)
- [ ] Verdict ≥ `Pass with follow-ups`; follow-ups have owner + bump target

## Risks & alternatives

### Risks

1. **Default-format convention footgun** — Consumer passes `delta.value = 12.4` thinking "12.4 percent change" but default format multiplies by 100, rendering "1240%". Mitigation: prominent doc note in usage.tsx + JSDoc on the `value` field; default format opts the consumer into the convention (override via `format` for non-percent units). Acceptable risk; the convention is internally consistent (matches `Intl.NumberFormat` percent style).
2. **Sparkline rendering at large N** — 200+ data points would create 200 path segments. Mitigated by 100-point cap with uniform sampling. Cost of sampling is O(N) one-time at render; bundle stays small.
3. **`betterIsHigher` boolean is binary** — what about metrics where neither up nor down is intrinsically good (e.g., user count for a B2B company where both growth and stability are valid)? Mitigation: omit `delta` entirely OR pass `delta.value === 0` (renders neutral). v0.2 candidate: `betterIsHigher: "neutral"` if real demand surfaces.
4. **Variant prop bloat** — adding more variants (e.g., "row" for table-row use) widens the discriminated union; consumer switches need a default fallback (per the F-cross-12 lessons magazine-layout documented). Acceptable; v0.2 widens with care.
5. **Loading state skeleton shape mismatch** — if the skeleton doesn't EXACTLY match the loaded layout, CLS > 0. Mitigation: skeleton uses the same DOM shape as the loaded card with `<Skeleton>` blocks substituted in; height-locked with `min-h-[N]rem` per variant.

### Alternatives considered

- **Three separate components** (`StatCard`, `StatCardCompact`, `StatCardDetailed`) instead of one with a variant prop. Rejected: 3× the API surface; consumers can't pick variant dynamically (e.g., responsive variant change); harder to share defaults.
- **`polarity: "positive" | "negative"` enum instead of `betterIsHigher: boolean`.** Rejected as ambiguous (description Stage 1 audit, fix #2). Boolean is unambiguous.
- **`direction` as a public prop on delta** (auto-derived from sign by default; consumer override). Rejected as redundant with sign of `value`. Internal-only computation now.
- **Charting library peer dep** (recharts / visx / chart.js for the sparkline). Rejected: ~30-line pure SVG covers the case; consumers wanting fancier charts use `renderTrend` slot.
- **Standalone `<Sparkline>` registry component** (not a sub-export of stat-card). Rejected: single registry component that pairs cleanly with stat-card is simpler than two separate registry items; the sub-export pattern (engagement-bar precedent) handles the standalone use case.
- **Polymorphic root via the `as` prop pattern** (`as?: ElementType`). Rejected: stat-card has a strong semantic shape (`<dl>`); consumers wanting different markup write their own. The polymorphism we DO want is in the link wrapper, handled via `linkComponent`.
- **Built-in real-time / live-counter** (internal `setInterval` ticker). Rejected per description out-of-scope. Pure presentation.

## Implementation order

1. Author `types.ts` (the contract).
2. Author `lib/format-default.ts` (one function).
3. Author `parts/sparkline.tsx` (pure SVG, ~30 LOC).
4. Author `stat-card.tsx` — main component, all three variants inline.
5. Author `dummy-data.ts` (fixtures for the 5 scenarios).
6. Author `meta.ts` (metadata).
7. Author `demo.tsx` (the 9 tabs).
8. Author `usage.tsx` (consumer prose).
9. Author `index.ts` (barrel; no `meta` export).
10. Add to `manifest.ts` (3 lines from scaffolder).
11. Verify `/components/stat-card` renders.
12. Add to `registry.json` (base + fixtures items).
13. `pnpm registry:build`; spot-check `public/r/stat-card.json`.
14. Author `stat-card-procomp-guide.md` (consumer-facing usage notes).
15. **GATE 3: spot-check review** (per [.claude/rules/component-readiness-review.md](../../.claude/rules/component-readiness-review.md)).
16. Update `STATUS.md`.
17. Commit + push.

---

> **Sign-off needed before any code lands.** This plan is the implementation contract; once signed off, scaffold → implement → review (GATE 3) per the workflow.

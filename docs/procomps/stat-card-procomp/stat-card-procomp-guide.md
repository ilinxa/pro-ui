# stat-card — consumer guide

> Stage 3: how to use it. Authored alongside the v0.1.0 ship.
>
> **Predecessors:** [`description.md`](./stat-card-procomp-description.md), [`plan.md`](./stat-card-procomp-plan.md). Component implementation lives at [`src/registry/components/data/stat-card/`](../../../src/registry/components/data/stat-card/).

## When to use

`stat-card` is the pro-ui answer to the "single number on a dashboard" pattern. Reach for it when you need to surface ONE calibrated metric — a value, what it means, how it's changed since some prior period, optionally a tiny trend visualization.

- Admin / ops dashboards (orders/hour, error rate, queue depth)
- Product analytics (DAUs, retention, conversion-funnel stages)
- Financial dashboards (revenue, MRR, churn, runway)
- Observability views (request latency, error budgets, uptime)
- Marketing dashboards (campaign performance, click-through, conversion lift)
- Sidebar widgets in content apps ("posts this week", "engagement rate")

## When NOT to use

- **Comparing two values side-by-side** — use a future `comparison-card` (deferred sibling). Stat-card is one number per card.
- **Many rows of numbers** — that's `data-table`, not many stat-cards.
- **A trend chart with axis labels and tooltips** — pass `renderTrend` to swap in your own chart, OR use a dedicated chart library standalone.
- **An interactive form widget** — stat-card is pure display; consumer-supplied click-through goes via `href` + `linkComponent`.
- **A live counter** — pass new `value` on each tick from your data source. The component doesn't run an internal `setInterval`.

## Variants

| Variant | Layout | Sparkline | Use when |
|---|---|---|---|
| `default` | Label / Value / Delta / Sparkline | Optional | Top-row KPI strip on dashboards (4 cards across, etc.) |
| `compact` | Label / Value / Delta | Never | Sidebar widgets; dense KPI grids; many cards stacked |
| `detailed` | Label / BIG Value / Delta / Sparkline | Mandatory | Hero KPI cards on landing pages; single-metric callouts |

## Composition patterns

### Top-row KPI strip (the canonical use case)

```tsx
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
  <StatCard
    value={revenue}
    label="Revenue this month"
    icon={DollarSign}
    formatValue={(v) => `$${v.toLocaleString()}`}
    delta={{ value: revenueDelta }}
    trend={revenueHistory}
  />
  <StatCard
    value={errorRate}
    label="Error rate (last 24h)"
    icon={AlertTriangle}
    formatValue={(v) => `${(v * 100).toFixed(2)}%`}
    delta={{ value: errorRateDelta, betterIsHigher: false }}
    trend={errorRateHistory}
  />
  {/* …two more */}
</div>
```

Each card consumes a different metric; deltas flip green/red per `betterIsHigher`. Sparklines on each give a sense of trend at a glance.

### Sidebar widgets

```tsx
<aside className="grid gap-3">
  <StatCard value={posts} label="Posts this week" variant="compact" delta={{ value: 0.18 }} />
  <StatCard value={"12.4k"} label="Reach" variant="compact" delta={{ value: 0.04 }} />
  <StatCard
    value={engagementRate}
    label="Engagement rate"
    variant="compact"
    formatValue={(v) => `${(v * 100).toFixed(1)}%`}
    delta={{ value: -0.012 }}
  />
</aside>
```

### Linked card with click-through

```tsx
<StatCard
  value={revenue}
  label="Revenue this month"
  icon={DollarSign}
  formatValue={(v) => `$${v.toLocaleString()}`}
  delta={{ value: 0.124, period: "vs last 30 days" }}
  href="/dashboard/revenue"
  linkComponent={Link}  // NextLink / RemixLink / etc.
  ariaLabel="Revenue detail page"  // optional override; defaults to "label: value"
/>
```

The whole card becomes clickable via the overlay-link pattern (a la `content-card-news-01` / `event-card-01`). Focus-visible ring lands on the card (not the inner link), so keyboard users see the same focus state as the visual treatment.

### Standalone sparkline (no card chrome)

```tsx
import { StatCardSparkline } from "@/components/stat-card";

<div className="flex items-center justify-between rounded-lg border p-4">
  <span className="text-sm font-medium">CPU utilization</span>
  <StatCardSparkline
    data={[42, 48, 55, 62, 68, 71, 67, 64]}
    className="h-8 w-32 text-primary"
  />
</div>
```

Pure SVG; no charting peer dep. Color via parent's `text-*` (uses `currentColor` by default). Size via `className`.

## Delta semantics — the `betterIsHigher` knob

The single most important thing to understand about stat-card.

```tsx
// Revenue ↑ is good (default — betterIsHigher: true)
<StatCard value={revenue} label="Revenue" delta={{ value: 0.124 }} />
// Renders "↑ +12.4% vs last period" in green

// Error rate ↑ is bad
<StatCard value={errorRate} label="Errors" delta={{ value: 0.08, betterIsHigher: false }} />
// Renders "↑ +8.0% vs last period" in red

// Latency ↓ is good (less = better)
<StatCard value={latency} label="Latency" delta={{ value: -0.08, betterIsHigher: false }} />
// Renders "↓ −8.0% vs last period" in green
```

Five color/arrow combinations:

| `delta.value` | `betterIsHigher` | Color | Arrow |
|---|---|---|---|
| positive | `true` | green | ↑ |
| positive | `false` | red | ↑ |
| negative | `true` | red | ↓ |
| negative | `false` | green | ↓ |
| `0` | (any) | neutral muted | → |

## Default delta format — the percent convention

The default `delta.format` is locale-aware `Intl.NumberFormat` with `style: "percent"` — meaning **`delta.value` is treated as a fraction** (`0.124` = 12.4%). Default rendering: `+12.4%` / `−8.0%` / `0%` (`signDisplay: "exceptZero"`).

For absolute-count deltas ("+1,240 users"), supply your own `format`:

```tsx
<StatCard
  value={signupCount}
  label="New signups this week"
  delta={{
    value: 1240,  // absolute count, not a fraction
    format: (v) => v.toLocaleString(undefined, { signDisplay: "exceptZero" }),
  }}
/>
// Renders "↑ +1,240 vs last period" in green
```

For non-percentage units (ms, $, GB), same pattern — pass `format`.

## Custom value rendering

Use `renderValue` for unit superscripts, tooltips, or any composite value treatment:

```tsx
<StatCard
  value={42.7}
  label="Average response time"
  renderValue={({ value }) => (
    <span>
      {typeof value === "number" ? value.toFixed(1) : value}
      <span className="text-base text-muted-foreground ml-1">ms</span>
    </span>
  )}
  delta={{ value: -0.08, betterIsHigher: false }}
/>
```

`renderValue` receives `{ value, loading }`. The `loading` flag is `true` only when the consumer rendered the loading skeleton through `renderValue` (rare); typically you can ignore it.

## Loading + empty states

| Prop combo | Renders |
|---|---|
| `loading={true}` | Skeleton at the same shape as the loaded variant. `aria-busy="true"` + sr-only loading announcement. No layout shift on hydration. |
| `value={undefined}`, `loading={false}` | `labels.emptyValueLabel` (default `—`) at the value position. Same height as a real value; muted color. |
| `value={undefined}`, `loading={true}` | Skeleton wins. |

```tsx
const { data, isLoading } = useMetrics();

<StatCard
  value={data?.revenue}  // undefined while loading; real number when fetched
  label="Revenue this month"
  loading={isLoading}
  delta={data ? { value: data.revenueDelta } : undefined}
/>
```

## i18n

All consumer-visible strings overridable via `labels`:

```tsx
<StatCard
  value={12431}
  label="Bu ay gelir"
  formatValue={(v) => `₺${v.toLocaleString("tr-TR")}`}
  delta={{
    value: 0.124,
    format: (v) => v.toLocaleString("tr-TR", {
      style: "percent",
      signDisplay: "exceptZero",
      maximumFractionDigits: 1,
    }),
    period: "geçen aya kıyasla",
  }}
  labels={{
    deltaPrefix: "vs.",
    deltaPeriod: "geçen dönem",
    increaseLabel: "artış",
    decreaseLabel: "azalış",
    loadingLabel: "Veri yükleniyor…",
    emptyValueLabel: "—",
  }}
/>
```

Number formatting is consumer-supplied via `delta.format` + locale arg. The component doesn't try to detect or default-set locale beyond what `Intl.NumberFormat`'s implicit user locale gives you.

## Cross-folder import contract

When this component composes another registry component (cross-folder import), it imports only from the OTHER component's `<slug>.tsx` file — never from `lib/`, `hooks/`, or `parts/` sub-folders. Conversely, when other registry components compose `stat-card`, they import only from `stat-card.tsx` (and `parts/sparkline.tsx` is also a declared sibling export — it's reachable via the `index.ts` barrel).

The constraint comes from how `pnpm dlx shadcn add` rewrites import paths in installed copies; sub-folder paths often don't survive cleanly.

See [`docs/component-guide.md` §11.6](../../component-guide.md) — *Cross-folder import constraint*.

## Gotchas

### Default format assumes percentage convention

If you pass `delta.value: 12.4` thinking that means "12.4% change," the default format will multiply by 100 and render `1240%`. The convention is **fraction (0–1 range)** = percentage; pass `0.124` for 12.4%, OR override `delta.format` for non-percent units.

### `betterIsHigher` is binary

For metrics where neither up nor down is intrinsically good (e.g., user count for a B2B company where both growth and stability are valid), omit `delta` entirely OR ensure `delta.value === 0` (renders neutral regardless of `betterIsHigher`). v0.2 candidate to add a `betterIsHigher: "neutral"` mode if real demand surfaces.

### Sparkline at 100+ points

Trend arrays larger than 100 points are uniformly downsampled (every Nth point, plus the last). The sample preserves the curve shape but loses fine detail. For dense time-series visualization, use the `renderTrend` slot to plug in a real charting library.

### Constant trend data

If all `trend` values are equal (zero variance), the sparkline renders a flat line at vertical center. Common in early-launch metrics; acceptable visual.

### Single-point trend

`trend.length < 2` skips the sparkline (no point connecting nothing). Pass at least 2 data points.

### Loading state needs explicit toggling

`loading=true → false` is consumer-driven via prop change. The component doesn't poll. If you have a loading flicker problem (data arrives but loading isn't flipped), check your data-fetching hook's loading state.

## v0.2 candidates

- **Goal / target prop** — `target?: number` with a tiny progress bar between value and delta rows ("12,431 / 15,000 monthly target").
- **Trend annotation** — highlighted points or hover tooltips on the sparkline.
- **`betterIsHigher: "neutral"`** for metrics where neither direction is intrinsically good.
- **Color-coded thresholds** — "red zone" / "yellow zone" semantic shading driven by a `threshold` prop instead of consumer-supplied `accentColor`.
- **`comparison-card` sibling** — two-up "this vs that" layout (currently out of scope).
- **`kpi-grid` sibling** — responsive layout for stat-card arrays with consistent gaps and breakpoints.

## Migration notes

None. Greenfield component, first ship at v0.1.0.

## Open follow-ups

- Real-world CLS measurement of the loading→loaded transition (currently aspirational target: < 0.05).
- Screen-reader pass against the `<dl>` markup to confirm announcement quality across NVDA / VoiceOver / JAWS.
- Dark-mode visual review of the `text-chart-2` "good" tone against the post-Phase-7 graphite-cool dark base.

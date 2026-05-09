# stat-card — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Greenfield component.** Not a migration. First component in a "metrics-domain" family. Future siblings (TBD): `kpi-grid` (layout for stat-card arrays with responsive breakpoints), `gauge-card` (radial-progress single-metric variant), `comparison-card` (this-vs-that side-by-side).

## Problem

Every dashboard, admin panel, analytics view, and observability surface needs the same micro-component: **one big number, one label, optional vs-prior-period delta, optional miniature trend chart**. Most teams rebuild it ad-hoc per project — and they consistently get small things wrong:

- Delta direction semantics: revenue ↑ is good (green), error rate ↑ is bad (red). One-size-fits-all "up=green" coloring is misleading half the time.
- Sparkline rendering: heavyweight chart libraries (recharts ~40 KB) for what should be 30 lines of SVG, OR no sparkline at all when one would communicate volumes.
- Number formatting: consumer responsibility, but the component should make `Intl.NumberFormat` ergonomic and locale-respectful, not push every team toward bespoke string-padding.
- Accessibility: the big number needs to be reachable by screen readers WITHOUT them announcing the visual decoration ("$ 12.4 thousand point three percent up arrow vs last month"). Requires careful aria.
- Loading skeletons that match the final shape (matching height, no layout shift on hydration).
- Click-through ergonomics — half of stat cards drill into a detail view; half are pure-display. The component should make both clean.

Pro-ui currently has no answer. `data-table` is for many-row tabular data. `content-card-news-01` is editorial. Nothing renders a single calibrated metric. This is the sort of component that quietly appears 12× on a dashboard page; the per-instance variation is small but the pattern surface is wide.

## In scope

- **3 visual variants** dispatched via a single `variant` prop:
  - `default` — value (large) + label + delta + optional sparkline. The canonical dashboard widget.
  - `compact` — smaller value, no sparkline; for sidebar widgets and dense KPI grids.
  - `detailed` — value + label + delta + sparkline + leading icon + optional secondary stats row (e.g., "from 1,200 last week"). For hero KPI cards.
- **Object-shape callbacks** from day one (per F-cross-12 lessons): `onClick?: (args: { event }) => void`, formatters take `(args: { value, ... })` where multiple inputs exist.
- **Built-in sparkline** as a sibling RSC-compatible part exported separately: `<StatCardSparkline data={[...]} />`. Pure SVG, no charting peer-dep. ~30 LOC. Consumers wanting different chart shapes (bar, dual-axis) bring their own via the `renderTrend` slot.
- **Delta semantics**: `delta` is object-shape with `value` (signed number), `direction?: "up" | "down" | "neutral"` (auto-derived from sign by default), and `polarity?: "positive" | "negative" | "neutral"` — the "is up good?" override. Example: error-rate cards pass `polarity: "negative"` so an upward delta colors red.
- **`renderValue` slot** for cases where the value isn't a primitive — e.g., a value with a unit superscript, a value with a tooltip, a sparkline-as-value treatment. Default is `Intl.NumberFormat`-driven via `formatValue` callback.
- **Polymorphic root** — `linkComponent` + `href` makes the whole card clickable with overlay-link pattern (a la `content-card-news-01` / `event-card-01`); when neither is provided, the card is a passive `<article>` (no focus ring, no click handling).
- **Loading state** — `loading={true}` renders a skeleton that exactly matches the final shape (height-locked, no layout shift on hydration).
- **Optional `icon`** — lucide-style `ComponentType<{ className?: string }>`. Default position: leading (top-left). `iconPosition: "leading" | "trailing"` for placement override.
- **i18n via `labels`** — keys: `deltaPrefix` ("vs"), `deltaPeriod` ("last period"), `loadingLabel` ("Loading metric…"), `polarityNegativeLabel` ("decrease"), `polarityPositiveLabel` ("increase"). Defaults English; consumers override per call or globally.
- **Soft-failure on missing optional fields** — only `value` + `label` are required. Delta absent → no delta row. Sparkline absent → no chart. Icon absent → no icon. Card adapts size accordingly.
- **WCAG 2.1 AA target** — `<dl>` markup so screen readers announce label-value pairs natively; sparkline is `aria-hidden="true"` (it's decorative, the value is in the dt/dd); delta has a `<span class="sr-only">{polarityLabel}</span>` so SRs say "12.4% increase" not "12.4% up arrow"; focus-visible ring on whole card when linked.

## Out of scope

- **KPI grid layout** — composing many stat-cards into a responsive grid with consistent gaps, breakpoints, sticky-row behavior. Defer to `kpi-grid` (sibling, not yet started). Consumers can always wrap a flat array in a `grid grid-cols-N gap-X` of their own.
- **Comparison cards** — "this period vs last period" side-by-side with two big numbers. Different layout shape entirely. Defer to `comparison-card`.
- **Gauge / radial cards** — circular progress + threshold zones. Defer to `gauge-card`.
- **Historical-data fetching** — sparkline data is consumer-supplied. No baked-in time-series API contract.
- **Real-time updates / live counters** — pure presentation. Consumer wires the data refresh via React state + sets `value` on each tick. No internal `setInterval`.
- **Drill-down panel / popover** — `href` opens a separate route. Inline drill-downs are out of scope; consumer can wrap in their own dialog if needed.
- **Aggregation logic** — stat-card doesn't sum, average, percentile, or otherwise compute. Consumer pre-computes and passes the final number.
- **Heavy chart variants** — bars, dual-axis, candlestick, anything beyond a single-line sparkline. Use `renderTrend` slot for those.
- **Trend annotation** (highlighted points, hover tooltips on the sparkline) — v0.2 candidate.
- **Color-coded thresholds** ("red zone", "yellow zone") — passed via `accentColor?` className override; no built-in threshold logic.
- **Animation** — number tickers, easing-in deltas, sparkline draw-on-mount. Tailwind transitions + `motion-safe:` only; no framer-motion.

## Target consumers

- **Internal admin / ops dashboards** — operations metrics (orders/hour, error rate, queue depth)
- **Product analytics surfaces** — DAUs, retention, conversion funnels broken down per stage
- **Financial dashboards** — revenue, MRR, churn, runway
- **Observability views** — request latency, error budgets, deployment health
- **Marketing dashboards** — campaign performance, click-through, conversion lift
- **Component playgrounds / demo pages** — quick "here's a metric" widget without spinning up a full chart

The consumer is a **frontend dev assembling a multi-metric dashboard**, typically with 6–24 stat-cards visible simultaneously. They've already done the data-fetching and number-crunching upstream; what they need is a fast, opinionated, polished display widget.

## Rough API sketch

```tsx
<StatCard
  value={12431}
  label="Revenue this month"
  formatValue={(v) => `$${v.toLocaleString()}`}
  delta={{ value: 0.124, format: (v) => `${(v * 100).toFixed(1)}%`, polarity: "positive" }}
  trend={[8200, 8800, 9100, 10200, 10900, 11500, 12100, 12431]}
  icon={DollarSign}
  variant="default"
  href="/dashboard/revenue"
  linkComponent={Link}
/>

<StatCard
  value={errorRate}
  label="Error rate (last 24h)"
  formatValue={(v) => `${v.toFixed(2)}%`}
  delta={{
    value: errorRateDelta,
    format: (v) => `${Math.abs(v * 100).toFixed(1)}%`,
    polarity: "negative",  // up is bad here — colors red on positive delta
  }}
  trend={errorRateHistory}
  icon={AlertTriangle}
/>

<StatCard
  value={1234}
  label="Active users"
  variant="compact"
  loading={isLoading}
/>

// Custom value rendering for unit-superscript pattern
<StatCard
  value={42.7}
  label="Average response time"
  renderValue={({ value }) => (
    <span>
      {value.toFixed(1)}<span className="text-muted-foreground text-base ml-1">ms</span>
    </span>
  )}
  delta={{ value: -0.08, polarity: "negative" }}
/>
```

## Example usages

**1. Admin dashboard top-row KPI strip (4 cards across)**

A `grid grid-cols-2 lg:grid-cols-4 gap-4` of `<StatCard variant="default">` instances. Each consumes a different metric; deltas flip green/red per polarity. Sparklines on each give a sense of trend at a glance. Click-through routes to the detail view per metric.

**2. Sidebar widgets in a content app**

Two or three `<StatCard variant="compact">` stacked in a sidebar — "Posts this week", "Reach", "Engagement rate". No sparklines (compact omits them); just value + delta. Tighter vertical rhythm than the dashboard variant.

**3. Hero KPI cards on a marketing landing page**

Two `<StatCard variant="detailed">` instances under the headline — "$1.2M ARR" and "98.7% uptime" — with sparklines that draw the eye and a polished icon-leading treatment. No href; pure display.

## Success criteria

The component is "done" when:

1. **All three variants render correctly** with sensible defaults across light + dark + the existing pro-ui theme tokens. Visual review of the three demos passes the design system mandate (Onest font, lime accent, OKLCH colors only).
2. **Delta polarity logic** is verifiably correct: positive delta + positive polarity = green text + up-arrow; positive delta + negative polarity = red text + up-arrow; etc. Six combinations (3 directions × 2 polarities, plus neutral). Each tested via demo tabs.
3. **Built-in sparkline** renders without a charting peer dep. Lighthouse accessibility audit on a 4-card demo strip: 100. No console errors at any data length (1, 2, many).
4. **Object-shape callbacks** from day one — no positional shapes; F-cross-12 lessons applied at construction.
5. **Loading skeleton** shape-matches the final state — visual layout-shift score (CLS) of 0 when toggling `loading=true → false`.
6. **Smoke harness install + tsc pass** (F-cross-11 path b) — `pnpm dlx shadcn add @ilinxa/stat-card` succeeds; consumer-side `pnpm tsc --noEmit` clean.
7. **Procomp doc trio complete** — description (this), plan, guide. Demo + usage covering all variants. Meta populated. registry.json shipped (base + fixtures items).
8. **Composable for the eventual `kpi-grid`** — passes the "would this work as the row content of a sibling layout component" test. No hard assumptions about parent shape.

## Open questions

1. **Sparkline data shape** — `number[]` (just values, equal-spaced) vs `Array<{ x: number; y: number }>` (explicit x-coords) vs `Array<{ date: string; value: number }>` (date-keyed). Recommendation: start with `number[]` for simplicity; add the richer shapes via overload if needed. Cost of starting simple is low because the slot `renderTrend` lets consumers replace the entire chart.

2. **Delta period prop** — should `delta.period` be a free-form ReactNode ("vs last 30 days", "since Tuesday", "from peak") or a structured `{ count, unit }` shape that the component formats? Recommendation: ReactNode — consumers know their copy better than we do. Less restrictive; matches the `labels` philosophy.

3. **Icon position default** — leading (top-left) vs trailing (top-right corner)? Recommendation: leading by default; trailing requires opt-in via `iconPosition: "trailing"`. Most dashboard cards I've seen put the icon top-left, balanced against the value's visual gravity bottom-right.

4. **Should we pre-pick `polarity` from common labels?** — "Error rate" ↑ is bad; "Revenue" ↑ is good. The component COULD heuristically derive polarity from a `metricCategory: "growth" | "cost" | "quality"` flag. **Recommendation: NO.** Heuristics are wrong half the time and impossible to debug. Make `polarity` an explicit prop.

5. **Polymorphic root for non-clickable cards** — when `href` is absent, render as `<article>`, `<section>`, or `<dl>`? Recommendation: `<dl>` to surface the label-value semantics. The icon + delta sit in metadata children of the `<dd>` to avoid extra `<dt>/<dd>` pairs. Need to validate with a screen-reader pass.

6. **Should `delta.value` be the raw signed number or the percentage?** — Either could mean "0.124 = +12.4%" or "12.4 = +12.4". Recommendation: raw signed number; the consumer-supplied `format` callback decides display. So `delta.value = 0.124` + `format: (v) => (v * 100).toFixed(1) + '%'`. Matches the same separation as React Number formatters.

7. **Stat card with a goal / target** — "12,431 / 15,000 monthly target". Out of scope for v0.1 but worth noting as a v0.2 candidate. Could be a `target?: number` prop with a tiny progress bar between value and delta rows.

8. **Empty state** — what does `value={undefined}` render? "—"? "No data"? The label still renders? Recommendation: when value is `undefined`, render a centered "—" in muted-foreground at the same size as the value would have been. Loading skeleton handles the "fetching" case; this handles the "fetched but empty" case.

9. **Multiple values per card** — some dashboards want "1,234 active / 567 new" in one card (two numbers, one label). v0.1 says: NO; use two stat-cards or use `comparison-card` (deferred sibling). v0.2 candidate to expand if real demand.

---

> **Sign-off needed before Stage 2 (plan).** Open questions above represent active uncertainties; recommendations are starting positions, not decisions. Reviewer should mark each open-question with their preferred resolution OR push back on the recommendation.

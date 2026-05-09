import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "stat-card",
  name: "Stat Card",
  category: "data",

  description:
    "Single-metric dashboard widget — value + label + optional delta + optional sparkline. 3 variants (default / compact / detailed); object-shape callbacks; built-in pure-SVG sparkline (no charting peer dep); polarity-aware coloring via `betterIsHigher`.",
  context:
    "Use anywhere a single calibrated metric needs to surface — admin / ops dashboards, product analytics surfaces, financial dashboards, observability views, marketing metrics. Object-shape `delta` from day one (F-cross-12-correct). Default delta format = locale-aware `Intl.NumberFormat` percent (`0.124` → `+12.4%`); `betterIsHigher: false` flips the green/red semantics for cost / error metrics where ↑ is bad. Sibling `<StatCardSparkline>` export covers standalone sparkline use without the card chrome. First component in the metrics-domain family; future siblings (TBD): kpi-grid (responsive layout), gauge-card (radial), comparison-card (two-up).",
  features: [
    "3 variants — default / compact / detailed",
    "Object-shape delta callback (F-cross-12-correct from day one)",
    "betterIsHigher boolean for cost / error semantics (default true)",
    "Built-in pure-SVG sparkline (no charting peer dep, ~50 LOC)",
    "Up to 100 trend points (uniform downsampling for larger datasets)",
    "<StatCardSparkline> sibling export for standalone use",
    "Default Intl.NumberFormat percent formatter (locale-aware, signDisplay: exceptZero)",
    "Loading state with shape-matched skeleton",
    "Empty state ('—' at value position when value is undefined)",
    "<dl> root for native screen-reader label-value pairs",
    "Polymorphic root via linkComponent + href (overlay-link pattern)",
    "renderValue + renderTrend escape hatches (object-shape contexts)",
    "WCAG 2.1 AA — sr-only delta semantic, aria-hidden sparkline + arrow, focus-visible ring on link",
  ],
  tags: ["stat-card", "metric", "kpi", "dashboard", "sparkline", "delta"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-09",
  updatedAt: "2026-05-09",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["skeleton"],
    npm: {},
    internal: [],
  },

  related: ["data-table", "content-card-news-01"],
};

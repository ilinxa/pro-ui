import type { ComponentType, ElementType, MouseEvent, ReactNode } from "react";

/** Visual variant. Default: 'default'. */
export type StatCardVariant = "default" | "compact" | "detailed";

/** Lucide-style icon prop. */
export type StatCardIcon = ComponentType<{ className?: string }>;

/** Position for the optional icon. Default: 'leading'. */
export type StatCardIconPosition = "leading" | "trailing";

/**
 * Delta payload — change since some prior period. Object-shape;
 * F-cross-12 lessons applied at construction.
 */
export interface StatCardDelta {
  /**
   * Signed number representing the change. **Convention: a fraction in 0–1
   * range representing a percentage** (`0.124` = +12.4%, `-0.08` = −8.0%).
   * The default `format` callback assumes this convention and renders via
   * `Intl.NumberFormat` with `style: "percent"`. For absolute counts
   * ("+1,240 users") or other units, override `format`.
   */
  value: number;
  /**
   * Custom formatter. Default: locale-aware
   * `Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" })`
   * → produces `+12.4%` / `−8.0%` / `0%`. Override for non-percentage units.
   */
  format?: (value: number) => string;
  /**
   * "Is up good?" — default `true`. Set `false` for cost / error metrics
   * where ↑ is bad (colors the upward delta red instead of green).
   */
  betterIsHigher?: boolean;
  /**
   * Optional period label rendered after the formatted delta value
   * (e.g. "vs last 30 days", "since Tuesday", "from peak"). ReactNode —
   * consumer owns the copy. Default: `labels.deltaPeriod` ("last period").
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
   * Click handler — F-cross-12-shape (object). Fired before navigation if
   * `href` is also set.
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

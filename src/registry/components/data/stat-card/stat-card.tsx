import type { ElementType, MouseEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { defaultDeltaFormat } from "./lib/format-default";
import { StatCardSparkline } from "./parts/sparkline";
import {
  DEFAULT_STAT_CARD_LABELS,
  type StatCardDelta,
  type StatCardLabels,
  type StatCardProps,
  type StatCardVariant,
} from "./types";

type DeltaTone = "good" | "bad" | "neutral";
type DeltaDirection = "up" | "down" | "neutral";

function deltaDirection(value: number): DeltaDirection {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
}

function deltaTone(direction: DeltaDirection, betterIsHigher: boolean): DeltaTone {
  if (direction === "neutral") return "neutral";
  if (direction === "up") return betterIsHigher ? "good" : "bad";
  return betterIsHigher ? "bad" : "good";
}

// pro-ui doesn't ship a dedicated `--success` token; using `text-chart-2`
// (calibrated green-leaning hue from the existing chart palette) for the
// "good" tone keeps the component themable via existing tokens. Consumers
// who want a custom green pass `deltaClassName`.
const TONE_CLASSES: Record<DeltaTone, string> = {
  good: "text-chart-2",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
};

interface DeltaRowProps {
  delta: StatCardDelta;
  labels: Required<StatCardLabels>;
  className?: string;
}

function DeltaRow({ delta, labels, className }: DeltaRowProps) {
  const dir = deltaDirection(delta.value);
  const tone = deltaTone(dir, delta.betterIsHigher ?? true);
  const formatted = (delta.format ?? defaultDeltaFormat)(delta.value);
  const period = delta.period ?? labels.deltaPeriod;
  const srLabel =
    dir === "up"
      ? labels.increaseLabel
      : dir === "down"
        ? labels.decreaseLabel
        : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-x-1.5 text-xs",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="font-medium">
        {dir === "up" ? "↑" : dir === "down" ? "↓" : "→"}
      </span>
      <span className="font-medium">{formatted}</span>
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      <span className="text-muted-foreground">
        {labels.deltaPrefix} {period}
      </span>
    </div>
  );
}

interface VariantSpec {
  /** Outer card padding + min-height (skeleton match). */
  padding: string;
  minHeight: string;
  /** Value text size. */
  valueSize: string;
  labelSize: string;
  /** Whether sparkline renders for this variant. */
  showSparkline: boolean;
  /** Default sparkline height in px (only used when sparkline renders). */
  sparklineHeight: number;
  /** Icon container size. */
  iconBoxSize: string;
  iconSize: string;
}

const VARIANT_SPEC: Record<StatCardVariant, VariantSpec> = {
  default: {
    padding: "p-5",
    minHeight: "min-h-[7.5rem]",
    valueSize: "text-2xl font-bold",
    labelSize: "text-sm",
    showSparkline: true,
    sparklineHeight: 28,
    iconBoxSize: "h-9 w-9 rounded-md bg-muted",
    iconSize: "h-4 w-4",
  },
  compact: {
    padding: "p-4",
    minHeight: "min-h-[5rem]",
    valueSize: "text-xl font-semibold",
    labelSize: "text-xs",
    showSparkline: false,
    sparklineHeight: 0,
    iconBoxSize: "h-8 w-8 rounded-md bg-muted",
    iconSize: "h-4 w-4",
  },
  detailed: {
    padding: "p-6",
    minHeight: "min-h-[10rem]",
    valueSize: "text-3xl font-bold",
    labelSize: "text-sm",
    showSparkline: true,
    sparklineHeight: 36,
    iconBoxSize: "h-11 w-11 rounded-lg bg-primary/10",
    iconSize: "h-5 w-5 text-primary",
  },
};

// Per-variant skeleton block sizes — hardcoded rather than derived from
// VARIANT_SPEC to avoid string-replace surgery on iconBoxSize (which contained
// `bg-primary/10` in the detailed variant, conflicting with Skeleton's own
// pulse-animation styling). See v0.1.0 review F-02.
const SKELETON_SIZES: Record<
  StatCardVariant,
  { iconBox: string; value: string; sparkline: string }
> = {
  default: { iconBox: "h-9 w-9 rounded-md", value: "h-7 w-24", sparkline: "h-7 w-full" },
  compact: { iconBox: "h-8 w-8 rounded-md", value: "h-6 w-20", sparkline: "h-7 w-full" },
  detailed: { iconBox: "h-11 w-11 rounded-lg", value: "h-9 w-32", sparkline: "h-9 w-full" },
};

function StatCardSkeleton({
  variant,
  labels,
  className,
}: {
  variant: StatCardVariant;
  labels: Required<StatCardLabels>;
  className?: string;
}) {
  const spec = VARIANT_SPEC[variant];
  const sk = SKELETON_SIZES[variant];
  return (
    // aria-busy on a generic div is sufficient — no role="region" (which
    // would require an accessible name we can't supply when loadingLabel
    // is a ReactNode). The sr-only span provides the spoken announcement.
    // See v0.1.0 review F-01.
    <div
      aria-busy="true"
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        spec.padding,
        spec.minHeight,
        className,
      )}
    >
      <span className="sr-only">{labels.loadingLabel}</span>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className={sk.iconBox} />
        </div>
        <Skeleton className={sk.value} />
        <Skeleton className="h-3 w-32" />
        {spec.showSparkline ? <Skeleton className={sk.sparkline} /> : null}
      </div>
    </div>
  );
}

interface IconBlockProps {
  spec: VariantSpec;
  Icon: NonNullable<StatCardProps["icon"]>;
}

function IconBlock({ spec, Icon }: IconBlockProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center text-muted-foreground",
        spec.iconBoxSize,
      )}
    >
      <Icon className={cn(spec.iconSize)} aria-hidden="true" />
    </div>
  );
}

export function StatCard(props: StatCardProps) {
  const {
    value,
    label,
    variant = "default",
    delta,
    trend,
    renderTrend,
    icon: Icon,
    iconPosition = "leading",
    formatValue,
    renderValue,
    href,
    linkComponent,
    onClick,
    loading = false,
    labels: labelsProp,
    className,
    valueClassName,
    labelClassName,
    deltaClassName,
    ariaLabel,
  } = props;

  const labels: Required<StatCardLabels> = {
    ...DEFAULT_STAT_CARD_LABELS,
    ...labelsProp,
  };

  if (loading) {
    return (
      <StatCardSkeleton variant={variant} labels={labels} className={className} />
    );
  }

  const spec = VARIANT_SPEC[variant];

  // Resolve the value cell's content. Priority: renderValue > formatValue > raw.
  // value === undefined renders the empty-state placeholder.
  const isEmpty = value === undefined;
  const valueNode = isEmpty
    ? labels.emptyValueLabel
    : renderValue
      ? renderValue({ value, loading: false })
      : formatValue
        ? formatValue(value)
        : String(value);

  // Trend rendering — only when the variant shows it AND data exists.
  let trendNode: React.ReactNode = null;
  if (spec.showSparkline) {
    if (renderTrend && trend) {
      trendNode = renderTrend({ data: trend, variant });
    } else if (trend && trend.length >= 2) {
      trendNode = (
        <StatCardSparkline
          data={trend}
          height={spec.sparklineHeight}
          className={cn(
            "w-full text-primary",
            variant === "detailed" ? "h-9" : "h-7",
          )}
        />
      );
    }
  }

  const showIconLeading = Icon && iconPosition === "leading";
  const showIconTrailing = Icon && iconPosition === "trailing";

  // Body — same shape across variants; spacing differs via spec.
  const body = (
    <>
      {/* Top row: label + (trailing icon) */}
      <div className="flex items-start justify-between gap-3">
        <dt
          className={cn(
            "font-medium text-muted-foreground",
            spec.labelSize,
            labelClassName,
          )}
        >
          {label}
        </dt>
        {showIconTrailing && Icon ? <IconBlock spec={spec} Icon={Icon} /> : null}
      </div>

      {/* Middle row: leading icon + big value */}
      <div className="flex items-center gap-3">
        {showIconLeading && Icon ? <IconBlock spec={spec} Icon={Icon} /> : null}
        <dd
          className={cn(
            "text-foreground tabular-nums",
            spec.valueSize,
            isEmpty && "text-muted-foreground",
            valueClassName,
          )}
        >
          {valueNode}
        </dd>
      </div>

      {/* Delta row */}
      {delta ? (
        <dd className="m-0">
          <DeltaRow delta={delta} labels={labels} className={deltaClassName} />
        </dd>
      ) : null}

      {/* Trend / sparkline */}
      {trendNode ? (
        <div
          className={cn(
            "mt-auto pt-2",
            variant === "detailed" ? "pt-3" : "pt-2",
          )}
        >
          {trendNode}
        </div>
      ) : null}
    </>
  );

  // Linked variant — overlay-link pattern. <dl> is the semantic root; the
  // <linkComponent> covers it for click capture and gets the focus ring.
  if (href) {
    const LinkComponent: ElementType = linkComponent ?? "a";
    const handleClick = onClick
      ? (event: MouseEvent) => onClick({ event })
      : undefined;
    // Resolve the link's accessible name. Priority:
    //   1. Consumer-supplied `ariaLabel` — wins absolutely.
    //   2. `${label}: ${value}` — when both are stringifiable.
    //   3. `${label}` only — when label is stringifiable but value isn't
    //      (notably value === undefined). v0.1.1 fix per review F-03 — the
    //      v0.1.0 implementation fell through to undefined here, leaving
    //      a linked card with no accessible name.
    //   4. undefined — when the label itself is a ReactNode and not a
    //      string. Consumer should supply ariaLabel explicitly in that case.
    const computedAriaLabel =
      ariaLabel ??
      (typeof label === "string"
        ? typeof value === "string" || typeof value === "number"
          ? `${label}: ${value}`
          : label
        : undefined);

    return (
      <div
        className={cn(
          "relative rounded-2xl border border-border bg-card text-card-foreground",
          "shadow-sm motion-safe:hover:shadow-md transition-shadow duration-200",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          spec.padding,
          spec.minHeight,
          className,
        )}
      >
        <dl className="flex h-full flex-col gap-2.5">{body}</dl>
        <LinkComponent
          href={href}
          aria-label={computedAriaLabel}
          onClick={handleClick}
          className="absolute inset-0 z-0 rounded-2xl outline-none"
        />
      </div>
    );
  }

  // Pure-display variant — no link wrapper, no focus ring.
  return (
    <dl
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border border-border bg-card text-card-foreground",
        spec.padding,
        spec.minHeight,
        className,
      )}
    >
      {body}
    </dl>
  );
}

export default StatCard;

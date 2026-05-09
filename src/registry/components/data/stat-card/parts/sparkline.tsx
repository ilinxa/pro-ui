/**
 * Pure-SVG single-line sparkline. Sibling export of stat-card; consumers can
 * use it standalone via `<StatCardSparkline data={[...]}>`.
 *
 * Server-renderable (no state, no client). aria-hidden — the meaningful
 * summary belongs to the surrounding label/value/delta context.
 */

import { cn } from "@/lib/utils";

export interface StatCardSparklineProps {
  /** Equal-spaced numeric values. */
  data: ReadonlyArray<number>;
  /** Default: 32. SVG viewBox height; visual height controlled by className. */
  height?: number;
  /** Default: 96. SVG viewBox width; visual width controlled by className. */
  width?: number;
  /** Default: `currentColor` (inherits parent text color). */
  strokeColor?: string;
  /** Default: 1.5. */
  strokeWidth?: number;
  /** Tailwind classes for the wrapping <svg>; size/color overrides land here. */
  className?: string;
}

const MAX_POINTS = 100;

function downsample(data: ReadonlyArray<number>): ReadonlyArray<number> {
  if (data.length <= MAX_POINTS) return data;
  // Uniform sampling — pick every Nth point so the trend shape is preserved.
  const step = data.length / MAX_POINTS;
  const out: number[] = [];
  for (let i = 0; i < MAX_POINTS; i++) out.push(data[Math.floor(i * step)]);
  // Always include the last point so the rightmost edge reflects the latest value.
  out[MAX_POINTS - 1] = data[data.length - 1];
  return out;
}

export function StatCardSparkline({
  data,
  height = 32,
  width = 96,
  strokeColor = "currentColor",
  strokeWidth = 1.5,
  className,
}: StatCardSparklineProps) {
  // Skip render for empty / single-point datasets.
  if (data.length < 2) return null;

  const points = downsample(data);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min;

  // Constant data → render a flat line at vertical center.
  const yFor = (v: number) =>
    range === 0 ? height / 2 : height - ((v - min) / range) * height;

  const xStep = width / (points.length - 1);
  const path = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * xStep).toFixed(2)} ${yFor(v).toFixed(2)}`)
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

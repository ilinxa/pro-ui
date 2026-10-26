"use client";

import { cn } from "@/lib/utils";

export interface UploadProgressProps {
  /** 0 to 1. Clamped; a missing or non-finite value reads as 0. */
  progress: number | undefined;
  /** Accessible name, e.g. `labels.uploadProgress(progress)`. */
  label: string;
  /** Visual only (no role) — used where the same state is exposed elsewhere. */
  decorative?: boolean;
  /** The item this bar belongs to; lets focus hand-off find it. */
  itemId?: string;
  className?: string;
}

/** Clamp to 0..1; NaN, Infinity and a missing value read as 0. */
export function clampProgress(progress: number | undefined): number {
  if (progress === undefined || !Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

/** A determinate progress bar. Without a number it shows an empty track. */
export function UploadProgress({
  progress,
  label,
  decorative,
  itemId,
  className,
}: UploadProgressProps) {
  const clamped = clampProgress(progress);
  const percent = Math.round(clamped * 100);
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({
        role: "progressbar",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": percent,
        "aria-label": label,
        tabIndex: -1,
        "data-progress-for": itemId,
      } as const);
  return (
    <div
      {...a11y}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-media-overlay",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

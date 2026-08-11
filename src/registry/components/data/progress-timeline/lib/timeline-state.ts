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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Pure function. Derives timeline state from start + end + an optional `now`.
 * Invalid dates clamp gracefully; out-of-window times return 0% / 100%.
 *
 * @example
 * deriveTimelineState("2026-04-01", "2026-06-30")
 *   // → { status: "active", percent: 67, daysToStart: -61, daysToEnd: 29, ... }
 */
export function deriveTimelineState(
  start: Date | string,
  end: Date | string,
  now: Date = new Date(),
): TimelineState {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Soft-failure on invalid dates
  const validStart = isNaN(startDate.getTime()) ? now : startDate;
  const validEnd = isNaN(endDate.getTime())
    ? validStart
    : endDate < validStart
      ? validStart
      : endDate;

  const totalMs = Math.max(1, validEnd.getTime() - validStart.getTime());
  const elapsedMs = now.getTime() - validStart.getTime();
  const percent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  const daysToStart = Math.ceil(
    (validStart.getTime() - now.getTime()) / MS_PER_DAY,
  );
  const daysFromStart = Math.floor(
    (now.getTime() - validStart.getTime()) / MS_PER_DAY,
  );
  const daysToEnd = Math.ceil(
    (validEnd.getTime() - now.getTime()) / MS_PER_DAY,
  );
  const totalDays = Math.max(1, Math.ceil(totalMs / MS_PER_DAY));

  let status: TimelineStatus;
  if (now < validStart) status = "before";
  else if (now > validEnd) status = "after";
  else status = "active";

  return {
    status,
    percent,
    daysToStart,
    daysFromStart,
    daysToEnd,
    totalDays,
  };
}

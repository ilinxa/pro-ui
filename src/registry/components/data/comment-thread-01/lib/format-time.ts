/** Coerces Date | string | number into a Date — matches event-card-01 / progress-timeline-01. */
export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Default English relative-time formatter for comments. Tighter granularity than
 * content-card-news-01's day-level formatter:
 *   < 1 min     → "Just now"
 *   < 60 min    → "5m"
 *   < 24 hours  → "2h"
 *   < 7 days    → "3d"
 *   < 5 weeks   → "2w"
 *   ≥ 5 weeks   → "March 5"  (or "March 5, 2025" if year differs)
 */
export function defaultRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;

  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return sameYear
    ? `${MONTHS[date.getMonth()]} ${date.getDate()}`
    : `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

import { defaultDateFormat } from "../lib/format-default";

/**
 * Default relative-time formatter — English, with absolute-date fallback
 * for dates older than ~30 days. Pure function; consumers override via
 * `formatRelativeTime` prop.
 *
 * Examples:
 *   defaultRelativeTime(today)        → "Today"
 *   defaultRelativeTime(yesterday)    → "Yesterday"
 *   defaultRelativeTime(3 days ago)   → "3 days ago"
 *   defaultRelativeTime(2 weeks ago)  → "2 weeks ago"
 *   defaultRelativeTime(2 months ago) → "March 5, 2026"
 */
export const defaultRelativeTime = (
  date: Date,
  now: Date = new Date(),
): string => {
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return defaultDateFormat(date);
};

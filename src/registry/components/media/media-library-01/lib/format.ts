import { format } from "date-fns";

/** Humanize a byte count → "12.8 GB", "512 KB", "0 B". */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  // whole bytes need no decimals; larger units get up to `decimals`
  const str = i === 0 ? String(Math.round(value)) : value.toFixed(decimals).replace(/\.0+$/, "");
  return `${str} ${units[i]}`;
}

/**
 * Compact relative time → "2h ago", "3d ago", "1w ago"; older than ~5 weeks
 * falls back to an absolute "Mar 24" (date-fns). Returns "" for missing input.
 */
export function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso);
  const ms = then.getTime();
  if (Number.isNaN(ms)) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";

  const sec = diff / 1000;
  const min = sec / 60;
  const hr = min / 60;
  const day = hr / 24;
  const week = day / 7;

  if (min < 1) return "just now";
  if (min < 60) return `${Math.floor(min)}m ago`;
  if (hr < 24) return `${Math.floor(hr)}h ago`;
  if (day < 7) return `${Math.floor(day)}d ago`;
  if (week < 5) return `${Math.floor(week)}w ago`;
  return format(then, "MMM d");
}

/** Fill a `{token}` template, e.g. tmpl("{used} of {total}", {used:"a",total:"b"}). */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

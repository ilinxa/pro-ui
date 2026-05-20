/**
 * Pure date helpers. No React. No locale-specific deps — uses Intl.* APIs only.
 */

const ISO_8601_RE =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

/** Returns Date or null. Validates format AND parseability (rejects "2026-12-99"). */
export function parseIso(value: string | undefined | null): Date | null {
  if (!value || typeof value !== "string") return null;
  if (!ISO_8601_RE.test(value)) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** ISO-8601 serializer; mirrors toISOString but null-safe. */
export function toIso(date: Date | null | undefined): string | undefined {
  if (!date || !Number.isFinite(date.getTime())) return undefined;
  return date.toISOString();
}

/**
 * Human-relative formatting via Intl.RelativeTimeFormat — "in 2 days", "3h ago".
 * Picks the largest unit that fits.
 */
export function formatRelative(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000],
  ];

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const [unit, msPerUnit] of units) {
    if (absMs >= msPerUnit || unit === "second") {
      const value = Math.round(diffMs / msPerUnit);
      return rtf.format(value, unit);
    }
  }
  return rtf.format(0, "second");
}

/** Absolute formatting: "May 20, 2026, 09:00". */
export function formatAbsolute(date: Date): string {
  const hasTime =
    date.getUTCHours() !== 0 ||
    date.getUTCMinutes() !== 0 ||
    date.getUTCSeconds() !== 0;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: hasTime ? "short" : undefined,
  }).format(date);
}

/**
 * Human-readable duration: "30 min", "2 h", "1 d 4 h".
 * Used when duration is set without expireAt.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 0) {
    const remHr = hr - day * 24;
    return remHr > 0 ? `${day}d ${remHr}h` : `${day}d`;
  }
  if (hr > 0) {
    const remMin = min - hr * 60;
    return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
  }
  if (min > 0) return `${min}m`;
  return `${sec}s`;
}

export function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

/** Resolve the `now` prop into a callable clock factory. */
export function resolveNowFactory(
  now: Date | (() => Date) | undefined,
): () => Date {
  if (now == null) return () => new Date();
  if (typeof now === "function") return now;
  // Frozen Date instance: copy on each call so consumers can't accidentally mutate.
  const frozen = now.getTime();
  return () => new Date(frozen);
}

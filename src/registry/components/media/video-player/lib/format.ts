import {
  defaultVideoPlayerLabels,
  type ResolvedVideoPlayerLabels,
  type VideoPlayerLabels,
} from "../types";

/** Merge `labels` over the defaults — an `undefined` value never erases a default (C2). */
export function resolveLabels(labels: VideoPlayerLabels | undefined): ResolvedVideoPlayerLabels {
  const out: ResolvedVideoPlayerLabels = { ...defaultVideoPlayerLabels };
  if (!labels) return out;
  for (const key of Object.keys(labels) as (keyof ResolvedVideoPlayerLabels)[]) {
    const value = labels[key];
    if (value !== undefined) (out as unknown as Record<string, unknown>)[key] = value;
  }
  return out;
}

/**
 * A valid BCP 47 tag for `locale`, else `"en"`. An invalid tag (`"en_US"` from an i18n library)
 * makes `Intl` throw — that must not take down the render.
 */
export function resolveLocale(locale: string | undefined): string {
  if (!locale) return "en";
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}

/**
 * The default duration format: `m:ss`, or `h:mm:ss` from one hour, with the locale's digits.
 * NaN / negative / infinite (a live stream) read as 0. Create it inside the component, memoised
 * on `locale` (C3) — never at module scope.
 */
export function createDurationFormatter(locale: string): (seconds: number) => string {
  const pad = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const plain = new Intl.NumberFormat(locale, { useGrouping: false });
  return (seconds) => {
    const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0
      ? `${plain.format(h)}:${pad.format(m)}:${pad.format(s)}`
      : `${plain.format(m)}:${pad.format(s)}`;
  };
}

/** `el.buffered` as plain ranges (jsdom and some browsers throw or return nothing). */
export function readBuffered(el: HTMLMediaElement): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  try {
    const ranges = el.buffered;
    if (!ranges) return out;
    for (let i = 0; i < ranges.length; i++) out.push({ start: ranges.start(i), end: ranges.end(i) });
  } catch {
    // not implemented — no ranges
  }
  return out;
}

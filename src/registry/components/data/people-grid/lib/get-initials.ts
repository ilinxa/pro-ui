const TITLE_PATTERN = /^(Dr|Prof|Mr|Mrs|Ms|Sr|Jr)\.?$/i;

export interface GetInitialsOptions {
  /** BCP 47 tag used for upper-casing (`"tr"`: ilker -> İ). Default: locale-independent upper-casing. */
  locale?: string;
  /**
   * Honorifics to skip. A list (compared case-insensitively, trailing `.` ignored) or a RegExp tested against each
   * word. Replaces the default English list (Dr, Prof, Mr, Mrs, Ms, Sr, Jr).
   */
  honorifics?: readonly string[] | RegExp;
  /** Returned for an empty name. Default `"?"`. */
  fallback?: string;
}

type Segmenter = { segment(input: string): Iterable<{ segment: string }> };

let cachedSegmenter: Segmenter | null | undefined;

function getSegmenter(): Segmenter | null {
  if (cachedSegmenter !== undefined) return cachedSegmenter;
  const Ctor = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => Segmenter })
    .Segmenter;
  try {
    cachedSegmenter = Ctor ? new Ctor(undefined, { granularity: "grapheme" }) : null;
  } catch {
    cachedSegmenter = null;
  }
  return cachedSegmenter;
}

/** First user-perceived character (grapheme) of `text`; falls back to the first code point. */
function firstGrapheme(text: string): string {
  if (!text) return "";
  const seg = getSegmenter();
  if (seg) {
    for (const part of seg.segment(text)) return part.segment;
  }
  return Array.from(text)[0] ?? "";
}

function upper(text: string, locale?: string): string {
  if (!locale) return text.toUpperCase();
  try {
    return text.toLocaleUpperCase(locale);
  } catch {
    return text.toUpperCase();
  }
}

function isHonorific(word: string, honorifics: GetInitialsOptions["honorifics"], locale?: string): boolean {
  if (!honorifics) return TITLE_PATTERN.test(word);
  if (honorifics instanceof RegExp) {
    honorifics.lastIndex = 0;
    return honorifics.test(word);
  }
  const key = (s: string) => {
    const bare = s.replace(/\.$/, "");
    try {
      return locale ? bare.toLocaleLowerCase(locale) : bare.toLowerCase();
    } catch {
      return bare.toLowerCase();
    }
  };
  const target = key(word);
  return honorifics.some((h) => key(h) === target);
}

/**
 * Pure function. Returns 1-2 uppercase initials from a name (first grapheme of the first and last word).
 *
 * Skips honorifics (default: Dr., Prof., Mr., Mrs., Ms., Sr., Jr.). The second argument is a locale string
 * (shorthand) or an options object.
 *
 * @example
 * getInitials("Dr. Ahmet Yılmaz")        // -> "AY"
 * getInitials("ilker yılmaz", "tr")      // -> "İY"
 * getInitials("Madonna")                 // -> "M"
 * getInitials("")                        // -> "?"
 */
export function getInitials(name: string, options?: string | GetInitialsOptions): string {
  const opts: GetInitialsOptions = typeof options === "string" ? { locale: options } : (options ?? {});
  const fallback = opts.fallback ?? "?";
  const trimmed = name.trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(/\s+/).filter((p) => !isHonorific(p, opts.honorifics, opts.locale));

  // Upper-case each initial on its own and keep one grapheme: "ß" upper-cases to "SS".
  const initial = (word: string) => firstGrapheme(upper(firstGrapheme(word), opts.locale));

  if (parts.length === 0) {
    return initial(trimmed) || fallback;
  }
  if (parts.length === 1) {
    return initial(parts[0]);
  }
  return initial(parts[0]) + initial(parts[parts.length - 1]);
}

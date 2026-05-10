/**
 * Append-only streaming-tokenize cache.
 *
 * When the consumer streams new content (each render's `value` is the
 * previous `value` + a tail), retokenizing the entire document is wasteful.
 *
 * Algorithm:
 *  - Stable boundary = the last newline in the previous value. Lines before
 *    the boundary cannot change (tokenization is line-local in Shiki/TextMate).
 *  - On each new value:
 *    - If !startsWith(prev): not an append → full retokenize.
 *    - Else: retokenize only `prevValue.slice(lastNewline + 1) ++ newTail`,
 *      reuse the cached HTML for lines before the boundary.
 *
 * The cache holds per-line HTML strings; concatenation rebuilds the full
 * output without re-running the tokenizer on stable lines.
 */
export interface StreamingCache {
  prevValue: string;
  prevHtmlLines: string[];
}

export function emptyCache(): StreamingCache {
  return { prevValue: "", prevHtmlLines: [] };
}

export interface CacheDiff {
  /** Lines before the stable boundary — reuse cached HTML. */
  stablePrefixLines: string[];
  /** The substring that needs re-tokenizing (suffix from last stable newline). */
  retokenizeSlice: string;
  /** Whether this is an append (true) or a replace (false). */
  isAppend: boolean;
}

export function diffForRetokenize(
  cache: StreamingCache,
  nextValue: string,
): CacheDiff {
  if (nextValue === cache.prevValue) {
    return {
      stablePrefixLines: cache.prevHtmlLines,
      retokenizeSlice: "",
      isAppend: true,
    };
  }
  if (!nextValue.startsWith(cache.prevValue)) {
    return {
      stablePrefixLines: [],
      retokenizeSlice: nextValue,
      isAppend: false,
    };
  }
  const lastNewline = cache.prevValue.lastIndexOf("\n");
  if (lastNewline < 0) {
    return {
      stablePrefixLines: [],
      retokenizeSlice: nextValue,
      isAppend: true,
    };
  }
  const stableLineCount = cache.prevValue.slice(0, lastNewline).split("\n").length;
  return {
    stablePrefixLines: cache.prevHtmlLines.slice(0, stableLineCount),
    retokenizeSlice: nextValue.slice(lastNewline + 1),
    isAppend: true,
  };
}

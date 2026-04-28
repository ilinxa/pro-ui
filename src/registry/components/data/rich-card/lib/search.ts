/**
 * Pure data-model search.
 *
 * Walks `RichCardTree` directly — finds matches in collapsed subtrees,
 * virtualized off-screen cards, and meta entries. No DOM dependence.
 */

import type {
  CustomPredefinedKey,
  FlatFieldValue,
  PredefinedKey,
  SearchMatch,
  SearchOptions,
  SearchResult,
} from "../types";
import type { RichCardPredefinedEntry, RichCardTree } from "./parse";

const EXCERPT_RADIUS = 32; // chars on each side of the match

export type SearchContext = {
  customKeys?: CustomPredefinedKey[];
};

export function searchTree(
  tree: RichCardTree,
  options: SearchOptions,
  ctx: SearchContext = {},
): SearchResult {
  const matches: SearchMatch[] = [];
  if (!options.query || options.query.length === 0) {
    return { matches, matchedCardIds: new Set(), activeIndex: null };
  }

  const flags = {
    matchTitles: options.matchTitles ?? true,
    matchKeys: options.matchKeys ?? true,
    matchValues: options.matchValues ?? true,
    matchPredefined: options.matchPredefined ?? true,
    matchMeta: options.matchMeta ?? true,
  };

  walk(tree, options.query, options.caseSensitive ?? false, flags, ctx, matches);

  const matchedCardIds = new Set<string>();
  for (const m of matches) matchedCardIds.add(m.cardId);

  return {
    matches,
    matchedCardIds,
    activeIndex: matches.length > 0 ? 0 : null,
  };
}

type Flags = {
  matchTitles: boolean;
  matchKeys: boolean;
  matchValues: boolean;
  matchPredefined: boolean;
  matchMeta: boolean;
};

function walk(
  node: RichCardTree,
  query: string,
  caseSensitive: boolean,
  flags: Flags,
  ctx: SearchContext,
  out: SearchMatch[],
): void {
  if (flags.matchTitles && node.parentKey) {
    addOccurrences(out, node.id, "title", undefined, node.parentKey, query, caseSensitive);
  }

  for (const field of node.fields) {
    if (flags.matchKeys) {
      addOccurrences(out, node.id, "field-key", field.key, field.key, query, caseSensitive);
    }
    if (flags.matchValues) {
      addOccurrences(
        out,
        node.id,
        "field-value",
        field.key,
        stringifyScalar(field.value),
        query,
        caseSensitive,
      );
    }
  }

  if (flags.matchPredefined) {
    for (const entry of node.predefined) {
      const text = stringifyPredefined(entry, ctx);
      if (text) {
        addOccurrences(out, node.id, "predefined", String(entry.key), text, query, caseSensitive);
      }
    }
  }

  if (flags.matchMeta && node.meta) {
    for (const [key, value] of Object.entries(node.meta)) {
      addOccurrences(out, node.id, "meta-key", key, key, query, caseSensitive);
      addOccurrences(
        out,
        node.id,
        "meta-value",
        key,
        stringifyScalar(value),
        query,
        caseSensitive,
      );
    }
  }

  for (const child of node.children) {
    walk(child, query, caseSensitive, flags, ctx, out);
  }
}

function stringifyScalar(v: FlatFieldValue): string {
  if (v === null) return "null";
  return String(v);
}

function stringifyPredefined(
  entry: RichCardPredefinedEntry,
  ctx: SearchContext,
): string {
  switch (entry.key) {
    case "codearea":
      return `${entry.value.format} ${entry.value.content}`;
    case "image":
      return `${entry.value.src} ${entry.value.alt ?? ""}`;
    case "table": {
      const t = entry.value;
      return [
        ...t.headers,
        ...t.rows.flat().map(stringifyScalar),
      ].join(" ");
    }
    case "quote":
      return entry.value;
    case "list":
      return entry.value.map(stringifyScalar).join(" ");
    default: {
      // Custom predefined-key — v0.3 doesn't search them by default (Q-P15 deferred).
      // If a `searchableText` is supplied, use it.
      const customKey = ctx.customKeys?.find(
        (k) => k.key === (entry as { key: string }).key,
      );
      if (customKey?.searchableText) {
        try {
          return customKey.searchableText((entry as { value: unknown }).value).join(" ");
        } catch {
          return "";
        }
      }
      return "";
    }
  }
  // suppress unused
  void ({} as PredefinedKey);
}

function addOccurrences(
  out: SearchMatch[],
  cardId: string,
  matchType: SearchMatch["matchType"],
  fieldKey: string | undefined,
  haystack: string,
  needle: string,
  caseSensitive: boolean,
): void {
  if (!haystack || !needle) return;
  const h = caseSensitive ? haystack : haystack.toLowerCase();
  const n = caseSensitive ? needle : needle.toLowerCase();
  let from = 0;
  while (from <= h.length) {
    const idx = h.indexOf(n, from);
    if (idx < 0) break;
    const excerptStart = Math.max(0, idx - EXCERPT_RADIUS);
    const excerptEnd = Math.min(haystack.length, idx + needle.length + EXCERPT_RADIUS);
    const excerpt =
      (excerptStart > 0 ? "…" : "") +
      haystack.slice(excerptStart, excerptEnd) +
      (excerptEnd < haystack.length ? "…" : "");
    out.push({
      cardId,
      matchType,
      fieldKey,
      excerpt,
      start: idx - excerptStart + (excerptStart > 0 ? 1 : 0),
      length: needle.length,
    });
    from = idx + needle.length;
  }
}

/**
 * Returns the ranges within a given string where matches should be highlighted,
 * filtered to a specific (cardId, matchType, fieldKey) context.
 *
 * Used by <MatchHighlight> to wrap matched text in <mark> elements.
 */
export function rangesFor(
  matches: readonly SearchMatch[],
  haystack: string,
  cardId: string,
  matchType: SearchMatch["matchType"],
  fieldKey: string | undefined,
  query: string,
  caseSensitive: boolean,
): Array<{ start: number; length: number }> {
  if (!query) return [];
  const relevant = matches.filter(
    (m) =>
      m.cardId === cardId &&
      m.matchType === matchType &&
      m.fieldKey === fieldKey,
  );
  if (relevant.length === 0) return [];
  // Re-run the indexOf locally to get exact positions in the haystack
  // (excerpt-based positions are relative to excerpt, not haystack).
  const ranges: Array<{ start: number; length: number }> = [];
  const h = caseSensitive ? haystack : haystack.toLowerCase();
  const n = caseSensitive ? query : query.toLowerCase();
  let from = 0;
  while (from <= h.length) {
    const idx = h.indexOf(n, from);
    if (idx < 0) break;
    ranges.push({ start: idx, length: query.length });
    from = idx + query.length;
  }
  return ranges;
}

import { useEffect, useMemo, useRef } from "react";
import type { Dispatch } from "react";
import type {
  CustomPredefinedKey,
  SearchOptions,
  SearchResult,
} from "../types";
import { searchTree } from "../lib/search";
import { findAncestorIds, type RichCardAction, type RichCardState } from "../lib/reducer";

/**
 * Wires the controlled `search` prop through the reducer:
 *   - On query change → search the tree, dispatch expand-path-to-matches
 *   - Returns the SearchResult for downstream consumers
 *   - Also tracks the active match index in reducer state
 */
export function useSearch(
  state: RichCardState,
  dispatch: Dispatch<RichCardAction>,
  options: SearchOptions | undefined,
  customKeys: readonly CustomPredefinedKey[] | undefined,
  onSearchResults: ((result: SearchResult) => void) | undefined,
): SearchResult {
  const result = useMemo(() => {
    if (!options || !options.query) {
      return {
        matches: [],
        matchedCardIds: new Set<string>(),
        activeIndex: null,
      };
    }
    return searchTree(state.tree, options, {
      customKeys: customKeys as CustomPredefinedKey[] | undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.tree,
    options?.query,
    options?.caseSensitive,
    options?.matchTitles,
    options?.matchKeys,
    options?.matchValues,
    options?.matchPredefined,
    options?.matchMeta,
    customKeys,
  ]);

  // Sync query into reducer (so collapse-state preservation works)
  const lastQueryRef = useRef("");
  useEffect(() => {
    const query = options?.query ?? "";
    if (query !== lastQueryRef.current) {
      lastQueryRef.current = query;
      dispatch({ type: "set-search-query", query });
    }
  }, [options?.query, dispatch]);

  // Sync expand-path-to-matches when results change
  useEffect(() => {
    if (result.matchedCardIds.size === 0) return;
    const ancestorIds = new Set<string>();
    for (const cardId of result.matchedCardIds) {
      const ancestors = findAncestorIds(state.tree, cardId);
      for (const a of ancestors) ancestorIds.add(a);
    }
    if (ancestorIds.size > 0) {
      dispatch({
        type: "expand-path-to-matches",
        ancestorIds: Array.from(ancestorIds),
      });
    }
  }, [result.matchedCardIds, state.tree, dispatch]);

  // Active index lives in reducer state (so it survives unrelated re-renders)
  // Sync the result.activeIndex with state.searchActiveIndex
  const enrichedResult = useMemo(
    () => ({
      ...result,
      activeIndex:
        state.searchActiveIndex !== null && state.searchActiveIndex < result.matches.length
          ? state.searchActiveIndex
          : result.matches.length > 0
            ? 0
            : null,
    }),
    [result, state.searchActiveIndex],
  );

  // Fire onSearchResults callback when the result identity changes
  const lastResultRef = useRef<SearchResult | null>(null);
  useEffect(() => {
    if (lastResultRef.current !== enrichedResult && onSearchResults) {
      onSearchResults(enrichedResult);
    }
    lastResultRef.current = enrichedResult;
  }, [enrichedResult, onSearchResults]);

  return enrichedResult;
}

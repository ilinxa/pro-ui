import { useMemo } from "react";
import type { RichCardState } from "../lib/reducer";
import { visibleIdsInOrder } from "../lib/reducer";

/**
 * Returns the ordered list of card ids currently visible in the tree, plus
 * helpers for prev/next/parent traversal. Recomputes only when the tree or
 * collapse set changes.
 */
export function useTreeFocus(state: RichCardState) {
  return useMemo(() => {
    const visible = visibleIdsInOrder(state.tree, state.collapsed);
    const indexById = new Map<string, number>();
    visible.forEach((id, i) => indexById.set(id, i));

    return {
      visible,
      first: visible[0] ?? null,
      last: visible[visible.length - 1] ?? null,
      next: (id: string | null): string | null => {
        if (id === null) return visible[0] ?? null;
        const i = indexById.get(id);
        if (i === undefined) return visible[0] ?? null;
        return visible[i + 1] ?? null;
      },
      prev: (id: string | null): string | null => {
        if (id === null) return visible[visible.length - 1] ?? null;
        const i = indexById.get(id);
        if (i === undefined) return visible[0] ?? null;
        return visible[i - 1] ?? null;
      },
    };
  }, [state.tree, state.collapsed]);
}

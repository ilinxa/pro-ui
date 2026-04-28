import { useCallback, useMemo, type Dispatch } from "react";
import type { RichCardAction, RichCardState } from "../lib/reducer";

/**
 * Memoized selector + dispatcher for collapse state.
 * The Card component reads state.collapsed directly for render; this hook is
 * for callers that need a stable closure over `isCollapsed` / `toggle`.
 */
export function useCollapseState(
  state: RichCardState,
  dispatch: Dispatch<RichCardAction>,
) {
  const isCollapsed = useCallback(
    (id: string) => state.collapsed.has(id),
    [state.collapsed],
  );

  const toggle = useCallback(
    (id: string) => dispatch({ type: "toggle-collapse", id }),
    [dispatch],
  );

  return useMemo(() => ({ isCollapsed, toggle }), [isCollapsed, toggle]);
}

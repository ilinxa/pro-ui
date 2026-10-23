import { useCallback, type Dispatch } from "react";
import type {
  CardTreeAction,
  CardTreeState,
} from "../lib/reducer";

/**
 * Stable selector + dispatcher for selection state.
 *
 * Selection is click-driven, distinct from focus (which is keyboard-driven).
 * This hook is single-select only; multi-select is tracked separately as `selectedIds` in the reducer state (see card-tree.tsx).
 */
export function useSelection(
  state: CardTreeState,
  dispatch: Dispatch<CardTreeAction>,
) {
  const select = useCallback(
    (id: string | null) => {
      dispatch({ type: "set-selection", id });
    },
    [dispatch],
  );

  const isSelected = useCallback(
    (id: string) => state.selectedId === id,
    [state.selectedId],
  );

  return {
    selectedId: state.selectedId,
    select,
    isSelected,
  };
}

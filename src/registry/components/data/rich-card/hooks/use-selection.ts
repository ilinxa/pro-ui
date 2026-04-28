import { useCallback, type Dispatch } from "react";
import type {
  RichCardAction,
  RichCardState,
} from "../lib/reducer";

/**
 * Stable selector + dispatcher for selection state.
 *
 * Selection is click-driven, distinct from focus (which is keyboard-driven).
 * Single-select only in v0.2. Multi-select arrives in v0.3.
 */
export function useSelection(
  state: RichCardState,
  dispatch: Dispatch<RichCardAction>,
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

import { useCallback, type Dispatch } from "react";
import type {
  RichCardAction,
  RichCardState,
} from "../lib/reducer";

/**
 * v0.3 multi-select helpers. Click semantics:
 *   - plain click       → replace selection with single id
 *   - shift-click       → range select from anchor to id
 *   - cmd/ctrl-click    → toggle id in/out of selection
 */
export function useBulkSelection(
  state: RichCardState,
  dispatch: Dispatch<RichCardAction>,
) {
  const select = useCallback(
    (id: string) => {
      dispatch({ type: "set-multi-selection", ids: [id], anchor: id });
    },
    [dispatch],
  );

  const toggle = useCallback(
    (id: string) => {
      dispatch({ type: "toggle-selection", id });
    },
    [dispatch],
  );

  const extend = useCallback(
    (id: string) => {
      dispatch({ type: "extend-selection-to", id });
    },
    [dispatch],
  );

  const clear = useCallback(() => {
    dispatch({ type: "clear-selection" });
  }, [dispatch]);

  const isSelected = useCallback(
    (id: string) => state.selectedIds.has(id),
    [state.selectedIds],
  );

  const handleClick = useCallback(
    (id: string, event: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => {
      if (event.shiftKey) extend(id);
      else if (event.metaKey || event.ctrlKey) toggle(id);
      else select(id);
    },
    [extend, toggle, select],
  );

  return {
    selectedIds: state.selectedIds,
    anchorId: state.selectionAnchorId,
    isSelected,
    select,
    toggle,
    extend,
    clear,
    handleClick,
  };
}

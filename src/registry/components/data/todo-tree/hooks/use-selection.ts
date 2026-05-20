import { useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import type { TodoTreeAction, TodoTreeVisibleRow } from "../types";
import type { TreeEventDispatcher } from "./use-tree-events";

export interface UseSelectionArgs {
  visibleItems: ReadonlyArray<TodoTreeVisibleRow>;
  selectionAnchorId: string | null;
  selectedIds: ReadonlySet<string>;
  dispatch: (action: TodoTreeAction) => void;
  /** Event dispatcher; the click handler fires itemClick through here. */
  fire: TreeEventDispatcher["fire"];
}

export interface UseSelectionResult {
  /** Plain / cmd-click / shift-click handler. Visibility-aware. */
  handleRowClick: (
    item: TodoItem,
    level: number,
    event: ReactMouseEvent,
  ) => void;
  /** Imperative range — replaces selection with the visible-row sequence between idA and idB. */
  selectRange: (idA: string, idB: string) => void;
  /** Imperative — replaces selection with every currently-visible row id. */
  selectAllVisible: () => void;
}

/**
 * Multi-select math. Resolves ranges + "all" over the live `visibleItems`
 * snapshot so the consumer's filterMode + collapse state are respected
 * (per plan §8.3 — Cmd+A "selects all VISIBLE items only").
 *
 * Shift-click ADDS the resolved range to existing selection (matches the
 * reducer's SELECT_ONE/range additive semantics — Shift+Cmd-click parity).
 * Imperative selectRange replaces the selection (set-selection-to-range
 * semantics for direct caller use).
 */
export function useSelection(args: UseSelectionArgs): UseSelectionResult {
  const { visibleItems, selectionAnchorId, selectedIds, dispatch, fire } = args;

  const handleRowClick = useCallback(
    (item: TodoItem, level: number, event: ReactMouseEvent) => {
      const isShift = event.shiftKey;
      const isCmd = event.metaKey || event.ctrlKey;

      if (isShift) {
        const rangeIds = resolveRangeOverVisible(
          visibleItems,
          selectionAnchorId,
          item.id,
        );
        if (rangeIds.length === 0) {
          // No anchor / target not in visible — fall back to replace.
          dispatch({ type: "SELECT_ONE", id: item.id, mode: "replace" });
          return;
        }
        const merged = new Set(selectedIds);
        for (const r of rangeIds) merged.add(r);
        dispatch({
          type: "SELECT_REPLACE",
          ids: Array.from(merged),
          anchorId: selectionAnchorId ?? item.id,
        });
        return;
      }

      if (isCmd) {
        dispatch({ type: "SELECT_ONE", id: item.id, mode: "toggle" });
        return;
      }

      // Plain click: replace selection AND fire itemClick. Modifier-click
      // does not fire itemClick (matches plan §8.1).
      dispatch({ type: "SELECT_ONE", id: item.id, mode: "replace" });
      fire("itemClick", { item, level, event });
    },
    [visibleItems, selectionAnchorId, selectedIds, dispatch, fire],
  );

  const selectRange = useCallback(
    (idA: string, idB: string) => {
      const rangeIds = resolveRangeOverVisible(visibleItems, idA, idB);
      if (rangeIds.length === 0) return;
      dispatch({
        type: "SELECT_REPLACE",
        ids: rangeIds,
        anchorId: idA,
      });
    },
    [visibleItems, dispatch],
  );

  const selectAllVisible = useCallback(() => {
    const ids: string[] = [];
    for (const row of visibleItems) ids.push(row.item.id);
    dispatch({ type: "SELECT_REPLACE", ids });
  }, [visibleItems, dispatch]);

  return { handleRowClick, selectRange, selectAllVisible };
}

function resolveRangeOverVisible(
  visibleItems: ReadonlyArray<TodoTreeVisibleRow>,
  anchorId: string | null,
  targetId: string,
): string[] {
  if (visibleItems.length === 0) return [];
  const targetIdx = visibleItems.findIndex((r) => r.item.id === targetId);
  if (targetIdx === -1) return [];
  const anchorIdx =
    anchorId === null
      ? 0
      : visibleItems.findIndex((r) => r.item.id === anchorId);
  if (anchorIdx === -1) return [visibleItems[targetIdx].item.id];
  const [lo, hi] =
    anchorIdx <= targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
  const out: string[] = [];
  for (let i = lo; i <= hi; i++) out.push(visibleItems[i].item.id);
  return out;
}

import { useCallback, useRef } from "react";

export interface ClickModifiers {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}

export interface SelectionApi {
  isSelected: (id: string) => boolean;
  /** Modifier-aware click: plain = replace, ⌘/Ctrl = toggle, Shift = range. */
  handleItemClick: (id: string, mods: ClickModifiers, orderedIds: string[]) => void;
  selectOne: (id: string) => void;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clear: () => void;
}

/**
 * Selection logic over a controllable `Set<string>`. Owns the shift-range
 * anchor. (file-manager's `use-selection` is private — this is a focused,
 * self-contained re-implementation per the GATE-2 Q5 decision.)
 */
export function useSelection(
  selected: Set<string>,
  setSelected: (ids: Set<string>) => void,
): SelectionApi {
  const anchorRef = useRef<string | null>(null);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectOne = useCallback(
    (id: string) => {
      anchorRef.current = id;
      setSelected(new Set([id]));
    },
    [setSelected],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      anchorRef.current = id;
      setSelected(next);
    },
    [selected, setSelected],
  );

  const handleItemClick = useCallback(
    (id: string, mods: ClickModifiers, orderedIds: string[]) => {
      if (mods.shiftKey && anchorRef.current) {
        const a = orderedIds.indexOf(anchorRef.current);
        const b = orderedIds.indexOf(id);
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          setSelected(new Set(orderedIds.slice(lo, hi + 1)));
          return;
        }
      }
      if (mods.metaKey || mods.ctrlKey) {
        toggle(id);
        return;
      }
      selectOne(id);
    },
    [selectOne, toggle, setSelected],
  );

  const selectAll = useCallback(
    (ids: string[]) => setSelected(new Set(ids)),
    [setSelected],
  );

  const clear = useCallback(() => {
    anchorRef.current = null;
    setSelected(new Set());
  }, [setSelected]);

  return { isSelected, handleItemClick, selectOne, toggle, selectAll, clear };
}

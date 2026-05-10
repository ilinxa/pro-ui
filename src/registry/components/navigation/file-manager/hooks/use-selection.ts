"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  FileManagerSelectionChangeArgs,
  FsNode,
} from "../types";

interface UseSelectionArgs {
  controlledIds?: Set<string>;
  defaultIds?: Set<string>;
  onSelectedChange?: (args: FileManagerSelectionChangeArgs) => void;
  /** Used to drop ids that no longer reference live nodes. */
  index: Map<string, FsNode>;
}

export interface UseSelectionResult {
  selectedIds: ReadonlySet<string>;
  select: (idOrIds: string | string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (visibleIds: string[]) => void;
  /** For Shift+click range select. Read in event handler context only. */
  getSelectionAnchorId: () => string | null;
  setSelectionAnchorId: (id: string | null) => void;
}

export function useSelection(args: UseSelectionArgs): UseSelectionResult {
  const { controlledIds, defaultIds, onSelectedChange, index } = args;

  const [internalIds, setInternalIds] = useState<Set<string>>(
    () => defaultIds ?? new Set(),
  );
  const anchorRef = useRef<string | null>(null);

  const selectedIds = controlledIds ?? internalIds;

  const setIds = useCallback(
    (next: Set<string>) => {
      if (controlledIds === undefined) setInternalIds(next);
      onSelectedChange?.({ ids: next });
    },
    [controlledIds, onSelectedChange],
  );

  const select = useCallback(
    (idOrIds: string | string[]) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      setIds(new Set(ids));
      if (ids.length > 0) anchorRef.current = ids[0];
    },
    [setIds],
  );

  const toggleSelection = useCallback(
    (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setIds(next);
      anchorRef.current = id;
    },
    [selectedIds, setIds],
  );

  const clearSelection = useCallback(() => {
    setIds(new Set());
    anchorRef.current = null;
  }, [setIds]);

  const selectAll = useCallback(
    (visibleIds: string[]) => {
      setIds(new Set(visibleIds));
    },
    [setIds],
  );

  const getSelectionAnchorId = useCallback(() => anchorRef.current, []);
  const setSelectionAnchorId = useCallback((id: string | null) => {
    anchorRef.current = id;
  }, []);

  // Sanitize: drop ids that no longer reference real nodes
  const sanitized = useMemo(() => {
    if (selectedIds.size === 0) return selectedIds;
    let dirty = false;
    const next = new Set<string>();
    for (const id of selectedIds) {
      if (index.has(id)) next.add(id);
      else dirty = true;
    }
    return dirty ? next : selectedIds;
  }, [selectedIds, index]);

  return {
    selectedIds: sanitized,
    select,
    toggleSelection,
    clearSelection,
    selectAll,
    getSelectionAnchorId,
    setSelectionAnchorId,
  };
}

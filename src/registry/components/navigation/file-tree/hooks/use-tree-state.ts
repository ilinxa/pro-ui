"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  FileTreeActions,
  FileTreeExpandedChangeArgs,
  FileTreeSelectionChangeArgs,
  FileTreeSelectionMode,
  FileTreeState,
  FsNode,
  FsNodeType,
} from "../types";
import {
  countAllNodes,
  deriveRootExpandedIds,
  indexNodes,
} from "../lib/tree-utils";

interface UseTreeStateArgs {
  nodes: FsNode[];
  selectionMode: FileTreeSelectionMode;
  selectedIds: Set<string> | undefined;
  defaultSelectedIds: Set<string> | undefined;
  onSelectedChange?: (args: FileTreeSelectionChangeArgs) => void;
  expandedIds: Set<string> | undefined;
  defaultExpandedIds: Set<string> | undefined;
  onExpandedChange?: (args: FileTreeExpandedChangeArgs) => void;
  onCreate?: (args: { parentId: string | null; type: FsNodeType }) => void;
  onDelete?: (args: { ids: string[] }) => void;
  onRefresh?: (args: { nodeId: string | null }) => void;
  confirmDelete: boolean;
  /**
   * Callback used by `triggerDelete` when `confirmDelete` is `true`. The
   * orchestrator implements this and shows the AlertDialog. When the dialog
   * confirms, it calls `onDelete` directly. When `confirmDelete` is `false`,
   * `triggerDelete` skips this and fires `onDelete` immediately.
   */
  requestDeleteConfirmation: (ids: string[]) => void;
}

export interface UseTreeStateResult {
  state: FileTreeState;
  actions: FileTreeActions;
  totalCount: number;
  /** Read the current selection anchor (use only inside event handlers, not during render). */
  getSelectionAnchorId: () => string | null;
  setSelectionAnchorId: (id: string | null) => void;
  /** Internal write helpers used by other hooks. */
  setLoadingFolderIds: (next: Set<string>) => void;
}

export function useTreeState(args: UseTreeStateArgs): UseTreeStateResult {
  const {
    nodes,
    selectionMode,
    selectedIds: controlledSelected,
    defaultSelectedIds,
    onSelectedChange,
    expandedIds: controlledExpanded,
    defaultExpandedIds,
    onExpandedChange,
    onCreate,
    onDelete,
    onRefresh,
    confirmDelete,
    requestDeleteConfirmation,
  } = args;

  // Initial uncontrolled state. `useState`'s lazy initializer keeps the
  // root-derive call O(roots) on first render only.
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    () => defaultExpandedIds ?? deriveRootExpandedIds(nodes),
  );
  const [internalSelected, setInternalSelected] = useState<Set<string>>(
    () => defaultSelectedIds ?? new Set(),
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [loadingFolderIds, setLoadingFolderIdsRaw] = useState<Set<string>>(
    () => new Set(),
  );
  const selectionAnchorRef = useRef<string | null>(null);

  const expandedIds = controlledExpanded ?? internalExpanded;
  const selectedIds = controlledSelected ?? internalSelected;

  const setExpanded = useCallback(
    (next: Set<string>) => {
      if (controlledExpanded === undefined) setInternalExpanded(next);
      onExpandedChange?.({ ids: next });
    },
    [controlledExpanded, onExpandedChange],
  );

  const setSelected = useCallback(
    (next: Set<string>) => {
      if (controlledSelected === undefined) setInternalSelected(next);
      onSelectedChange?.({ ids: next });
    },
    [controlledSelected, onSelectedChange],
  );

  const expand = useCallback(
    (id: string) => {
      if (expandedIds.has(id)) return;
      const next = new Set(expandedIds);
      next.add(id);
      setExpanded(next);
    },
    [expandedIds, setExpanded],
  );

  const collapse = useCallback(
    (id: string) => {
      if (!expandedIds.has(id)) return;
      const next = new Set(expandedIds);
      next.delete(id);
      setExpanded(next);
    },
    [expandedIds, setExpanded],
  );

  const toggleExpand = useCallback(
    (id: string) => {
      const next = new Set(expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpanded(next);
    },
    [expandedIds, setExpanded],
  );

  const expandAll = useCallback(() => {
    const next = new Set<string>();
    const walk = (list: FsNode[]) => {
      for (const node of list) {
        if (node.type === "folder") next.add(node.id);
        if (node.children) walk(node.children);
      }
    };
    walk(nodes);
    setExpanded(next);
  }, [nodes, setExpanded]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, [setExpanded]);

  const select = useCallback(
    (idOrIds: string | string[]) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      if (selectionMode === "single") {
        setSelected(new Set(ids.slice(0, 1)));
      } else {
        setSelected(new Set(ids));
      }
      if (ids.length > 0) selectionAnchorRef.current = ids[0];
    },
    [selectionMode, setSelected],
  );

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    selectionAnchorRef.current = null;
  }, [setSelected]);

  const focusNode = useCallback((id: string) => {
    setFocusedId(id);
  }, []);

  const startRename = useCallback((id: string) => {
    setRenamingId(id);
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const triggerCreate = useCallback(
    (parentId: string | null, type: FsNodeType) => {
      onCreate?.({ parentId, type });
    },
    [onCreate],
  );

  const triggerDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      if (confirmDelete) {
        requestDeleteConfirmation(ids);
        return;
      }
      onDelete?.({ ids });
    },
    [confirmDelete, requestDeleteConfirmation, onDelete],
  );

  const refresh = useCallback(
    (nodeId: string | null = null) => {
      onRefresh?.({ nodeId });
    },
    [onRefresh],
  );

  const setSelectionAnchorId = useCallback((id: string | null) => {
    selectionAnchorRef.current = id;
  }, []);

  const setLoadingFolderIds = useCallback((next: Set<string>) => {
    setLoadingFolderIdsRaw(next);
  }, []);

  const totalCount = useMemo(() => countAllNodes(nodes), [nodes]);

  // Drop selection ids that no longer reference real nodes
  const sanitizedSelectedIds = useMemo(() => {
    if (selectedIds.size === 0) return selectedIds;
    const idx = indexNodes(nodes);
    let dirty = false;
    const next = new Set<string>();
    for (const id of selectedIds) {
      if (idx.has(id)) next.add(id);
      else dirty = true;
    }
    return dirty ? next : selectedIds;
  }, [nodes, selectedIds]);

  const state: FileTreeState = useMemo(
    () => ({
      expandedIds,
      selectedIds: sanitizedSelectedIds,
      focusedId,
      renamingId,
      loadingFolderIds,
    }),
    [
      expandedIds,
      sanitizedSelectedIds,
      focusedId,
      renamingId,
      loadingFolderIds,
    ],
  );

  const actions: FileTreeActions = useMemo(
    () => ({
      expand,
      collapse,
      toggleExpand,
      expandAll,
      collapseAll,
      select,
      clearSelection,
      focusNode,
      startRename,
      cancelRename,
      triggerCreate,
      triggerDelete,
      refresh,
    }),
    [
      expand,
      collapse,
      toggleExpand,
      expandAll,
      collapseAll,
      select,
      clearSelection,
      focusNode,
      startRename,
      cancelRename,
      triggerCreate,
      triggerDelete,
      refresh,
    ],
  );

  const getSelectionAnchorId = useCallback(
    () => selectionAnchorRef.current,
    [],
  );

  return {
    state,
    actions,
    totalCount,
    getSelectionAnchorId,
    setSelectionAnchorId,
    setLoadingFolderIds,
  };
}

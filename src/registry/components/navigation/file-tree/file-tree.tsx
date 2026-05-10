"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DEFAULT_FILE_TREE_LABELS,
  type FileTreeHandle,
  type FileTreeHeaderContext,
  type FileTreeProps,
  type FileTreeRow,
  type FsNode,
} from "./types";
import {
  FileTreeContext,
  type FileTreeContextValue,
} from "./hooks/use-file-tree-context";
import { useTreeState } from "./hooks/use-tree-state";
import { useTreeFlatten } from "./hooks/use-tree-flatten";
import { useLazyLoad } from "./hooks/use-lazy-load";
import { useTreeVirtual } from "./hooks/use-tree-virtual";
import { useTreeDrag } from "./hooks/use-tree-drag";
import { useTreeKeyboard } from "./hooks/use-tree-keyboard";
import { findNode, indexNodes } from "./lib/tree-utils";
import { validateNodes } from "./lib/validation";
import { FileTreeHeader } from "./parts/file-tree-header";
import { FileTreeRowList } from "./parts/file-tree-row-list";
import { FileTreeEmpty } from "./parts/file-tree-empty";
import { FileTreeLoading } from "./parts/file-tree-loading";
import { FileTreeDragOverlay } from "./parts/file-tree-drag-overlay";
import { FileTreeDeleteConfirm } from "./parts/file-tree-delete-confirm";
import { FileTreeContextMenu } from "./parts/file-tree-context-menu";

export const FileTree = forwardRef<FileTreeHandle, FileTreeProps>(
  function FileTree(props, ref) {
    const {
      nodes,
      loading = false,
      selectionMode = "single",
      selectedIds,
      defaultSelectedIds,
      onSelectedChange,
      expandedIds,
      defaultExpandedIds,
      onExpandedChange,
      onLoadChildren,
      onOpen,
      onCreate,
      onRename,
      onDelete,
      onMove,
      onRefresh,
      onExternalDrop,
      validateRename,
      iconForNode,
      renderRow,
      renderHeader,
      renderContextMenu,
      renderEmpty,
      renderLoading,
      renderDeleteConfirm,
      header = true,
      title,
      showNewFile = true,
      showNewFolder = true,
      showRefresh = true,
      showCollapseAll = true,
      contextMenu = true,
      contextMenuActions,
      showHidden = false,
      isHidden,
      sortNodes,
      indentGuides = true,
      rowHeight = 28,
      indent = 18,
      confirmDelete = true,
      enableInternalDrag = true,
      enableExternalDrop = true,
      virtualize = "auto",
      virtualizeThreshold = 200,
      className,
      style,
      labels: labelsOverride,
    } = props;

    const labels = useMemo(
      () => ({ ...DEFAULT_FILE_TREE_LABELS, ...labelsOverride }),
      [labelsOverride],
    );

    // ── Pending delete (alertdialog) ───────────────────────────────────────
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
    const requestDeleteConfirmation = useCallback(
      (ids: string[]) => setPendingDeleteIds(ids),
      [],
    );

    // ── State + actions ────────────────────────────────────────────────────
    const stateHook = useTreeState({
      nodes,
      selectionMode,
      selectedIds,
      defaultSelectedIds,
      onSelectedChange,
      expandedIds,
      defaultExpandedIds,
      onExpandedChange,
      onCreate,
      onDelete,
      onRefresh,
      confirmDelete,
      requestDeleteConfirmation,
    });

    // ── Lazy load wiring ───────────────────────────────────────────────────
    const lazy = useLazyLoad({
      onLoadChildren,
      setLoadingFolderIds: stateHook.setLoadingFolderIds,
    });

    // Auto-fire onLoadChildren when consumer expands a folder w/ children=undefined.
    useEffect(() => {
      if (!onLoadChildren) return;
      for (const id of stateHook.state.expandedIds) {
        const node = findNode(id, nodes);
        if (
          node &&
          node.type === "folder" &&
          node.children === undefined &&
          !lazy.errors.has(node.id)
        ) {
          lazy.load(node);
        }
      }
      // We intentionally exclude `lazy` from deps to avoid re-firing on
      // every error-state update. The fields we care about are above.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stateHook.state.expandedIds, nodes, onLoadChildren]);

    // ── Visible-row flatten ────────────────────────────────────────────────
    const rows = useTreeFlatten({
      nodes,
      expandedIds: stateHook.state.expandedIds,
      selectedIds: stateHook.state.selectedIds,
      focusedId: stateHook.state.focusedId,
      loadingFolderIds: stateHook.state.loadingFolderIds,
      showHidden,
      isHidden,
      sortNodes,
    });

    // ── Drag ───────────────────────────────────────────────────────────────
    const drag = useTreeDrag({
      nodes,
      enableInternalDrag,
      enableExternalDrop,
      selectedIds: stateHook.state.selectedIds,
      selectionMode,
      onMove,
      onExternalDrop,
      selectIds: stateHook.actions.select,
    });

    // ── Keyboard ───────────────────────────────────────────────────────────
    const kb = useTreeKeyboard({
      rows,
      focusedId: stateHook.state.focusedId,
      renamingId: stateHook.state.renamingId,
      selectionMode,
      selectedIds: stateHook.state.selectedIds,
      actions: stateHook.actions,
      onOpen,
    });

    // ── Validate nodes (dev) ───────────────────────────────────────────────
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      const warnings = validateNodes(nodes);
      for (const w of warnings) {
        console.warn("[file-tree]", w);
      }
    }, [nodes]);

    // ── Imperative handle ──────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        state: stateHook.state,
        actions: stateHook.actions,
      }),
      [stateHook.state, stateHook.actions],
    );

    // ── Index for context-menu target lookup ───────────────────────────────
    const nodeIndex = useMemo(() => indexNodes(nodes), [nodes]);

    // ── Row click + double-click + chevron + context-menu ──────────────────
    const onRowClick = useCallback(
      (e: MouseEvent, row: FileTreeRow) => {
        if (selectionMode === "multi" && (e.metaKey || e.ctrlKey)) {
          const next = new Set(stateHook.state.selectedIds);
          if (next.has(row.node.id)) next.delete(row.node.id);
          else next.add(row.node.id);
          stateHook.actions.select(Array.from(next));
          stateHook.setSelectionAnchorId(row.node.id);
        } else if (selectionMode === "multi" && e.shiftKey) {
          const anchor = stateHook.getSelectionAnchorId();
          if (!anchor) {
            stateHook.actions.select(row.node.id);
            stateHook.setSelectionAnchorId(row.node.id);
          } else {
            const aIdx = rows.findIndex((r) => r.node.id === anchor);
            const bIdx = rows.findIndex((r) => r.node.id === row.node.id);
            if (aIdx !== -1 && bIdx !== -1) {
              const [from, to] = aIdx < bIdx ? [aIdx, bIdx] : [bIdx, aIdx];
              const ids = rows.slice(from, to + 1).map((r) => r.node.id);
              stateHook.actions.select(ids);
            }
          }
        } else {
          stateHook.actions.select(row.node.id);
          stateHook.setSelectionAnchorId(row.node.id);
        }
        stateHook.actions.focusNode(row.node.id);
      },
      [selectionMode, stateHook, rows],
    );

    const onChevronClick = useCallback(
      (_e: MouseEvent, row: FileTreeRow) => {
        if (row.node.type !== "folder") return;
        stateHook.actions.toggleExpand(row.node.id);
      },
      [stateHook.actions],
    );

    const onRowDoubleClick = useCallback(
      (_e: MouseEvent, row: FileTreeRow) => {
        if (row.node.type === "folder") {
          stateHook.actions.toggleExpand(row.node.id);
        } else {
          onOpen?.({ node: row.node });
        }
      },
      [stateHook.actions, onOpen],
    );

    const onRowContextMenu = useCallback(
      (_e: MouseEvent, row: FileTreeRow) => {
        if (!stateHook.state.selectedIds.has(row.node.id)) {
          stateHook.actions.select(row.node.id);
        }
        stateHook.actions.focusNode(row.node.id);
      },
      [stateHook.state.selectedIds, stateHook.actions],
    );

    const onRenameCommit = useCallback(
      (id: string, nextName: string) => {
        const node = findNode(id, nodes);
        if (node && onRename) onRename({ id, node, nextName });
        stateHook.actions.cancelRename();
      },
      [nodes, onRename, stateHook.actions],
    );

    const onRenameCancel = useCallback(() => {
      stateHook.actions.cancelRename();
    }, [stateHook.actions]);

    // ── Header context (for renderHeader slot) ─────────────────────────────
    const totalCount = stateHook.totalCount;
    const visibleCount = rows.length;

    const headerCtx: FileTreeHeaderContext = useMemo(
      () => ({
        state: stateHook.state,
        actions: stateHook.actions,
        totalCount,
        visibleCount,
        showNewFile,
        showNewFolder,
        showRefresh,
        showCollapseAll,
        title,
        labels,
      }),
      [
        stateHook.state,
        stateHook.actions,
        totalCount,
        visibleCount,
        showNewFile,
        showNewFolder,
        showRefresh,
        showCollapseAll,
        title,
        labels,
      ],
    );

    // ── Public Context value ───────────────────────────────────────────────
    const ctxValue: FileTreeContextValue = useMemo(
      () => ({
        state: stateHook.state,
        actions: stateHook.actions,
        rows,
        totalCount,
        visibleCount,
        showNewFile,
        showNewFolder,
        showRefresh,
        showCollapseAll,
        title,
        labels,
      }),
      [
        stateHook.state,
        stateHook.actions,
        rows,
        totalCount,
        visibleCount,
        showNewFile,
        showNewFolder,
        showRefresh,
        showCollapseAll,
        title,
        labels,
      ],
    );

    // ── Virtualization ─────────────────────────────────────────────────────
    const scrollRef = useRef<HTMLDivElement>(null);
    const v = useTreeVirtual({
      rows,
      scrollRef,
      mode: virtualize,
      threshold: virtualizeThreshold,
      rowHeight,
    });

    // ── Body content ───────────────────────────────────────────────────────
    let body: React.ReactNode;
    if (loading) {
      body = renderLoading?.() ?? <FileTreeLoading />;
    } else if (nodes.length === 0) {
      body =
        renderEmpty?.({
          actions: stateHook.actions,
          showNewFile,
          showNewFolder,
          labels,
        }) ?? <FileTreeEmpty />;
    } else {
      const list = (
        <div className="relative h-full min-h-0 flex-1">
          <FileTreeRowList
            rows={rows}
            rowHeight={rowHeight}
            indent={indent}
            indentGuides={indentGuides}
            iconForNode={iconForNode}
            renamingId={stateHook.state.renamingId}
            validateRename={validateRename}
            enableInternalDrag={enableInternalDrag}
            dragOver={drag.dragOver}
            loadErrors={lazy.errors}
            onRetryLoad={(nodeId) => {
              const node = findNode(nodeId, nodes);
              if (node) {
                lazy.clearError(nodeId);
                lazy.load(node);
              }
            }}
            labels={labels}
            virtualizer={v.active ? v.virtualizer : undefined}
            scrollRef={scrollRef}
            renderRow={renderRow}
            onRowClick={onRowClick}
            onChevronClick={onChevronClick}
            onRowDoubleClick={onRowDoubleClick}
            onRowContextMenu={onRowContextMenu}
            onRenameCommit={onRenameCommit}
            onRenameCancel={onRenameCancel}
            onRowDragStart={drag.onRowDragStart}
            onRowDragOver={drag.onRowDragOver}
            onRowDragLeave={drag.onRowDragLeave}
            onRowDrop={drag.onRowDrop}
            onRowDragEnd={drag.onRowDragEnd}
          />
        </div>
      );
      body = (
        <FileTreeContextMenu
          state={stateHook.state}
          actions={stateHook.actions}
          enabled={contextMenu}
          labels={labels}
          gates={{
            open: contextMenuActions?.open ?? true,
            newFile: contextMenuActions?.newFile ?? true,
            newFolder: contextMenuActions?.newFolder ?? true,
            rename: contextMenuActions?.rename ?? true,
            delete: contextMenuActions?.delete ?? true,
            refresh: contextMenuActions?.refresh ?? true,
          }}
          wired={{
            onOpen: !!onOpen,
            onCreate: !!onCreate,
            onRename: !!onRename,
            onDelete: !!onDelete,
            onRefresh: !!onRefresh,
          }}
          nodeIndex={nodeIndex}
          renderContextMenu={renderContextMenu}
        >
          {list}
        </FileTreeContextMenu>
      );
    }

    // ── Pending-delete dialog ──────────────────────────────────────────────
    const pendingNodes: FsNode[] = useMemo(
      () =>
        pendingDeleteIds
          .map((id) => nodeIndex.get(id))
          .filter((n): n is FsNode => Boolean(n)),
      [pendingDeleteIds, nodeIndex],
    );

    const onConfirmDelete = useCallback(() => {
      if (pendingDeleteIds.length === 0) return;
      onDelete?.({ ids: pendingDeleteIds });
      setPendingDeleteIds([]);
    }, [onDelete, pendingDeleteIds]);

    const onCancelDelete = useCallback(() => {
      setPendingDeleteIds([]);
    }, []);

    return (
      <FileTreeContext.Provider value={ctxValue}>
       <TooltipProvider delayDuration={400}>
        <div
          role="tree"
          tabIndex={stateHook.state.focusedId === null ? 0 : -1}
          aria-label={title ?? labels.title}
          className={cn(
            "relative flex h-full w-full flex-col overflow-hidden rounded-md border border-border/60 bg-background text-foreground outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
          style={style}
          onKeyDown={kb.onKeyDown}
          onDragEnter={drag.onContainerDragEnter}
          onDragOver={drag.onContainerDragOver}
          onDragLeave={drag.onContainerDragLeave}
          onDrop={drag.onContainerDrop}
        >
          {header
            ? (renderHeader ? renderHeader(headerCtx) : <FileTreeHeader />)
            : null}
          {body}
          <FileTreeDragOverlay
            visible={drag.isExternalDragging}
            labels={labels}
          />
          {confirmDelete && pendingDeleteIds.length > 0 ? (
            renderDeleteConfirm ? (
              renderDeleteConfirm({
                ids: pendingDeleteIds,
                nodes: pendingNodes,
                onConfirm: onConfirmDelete,
                onCancel: onCancelDelete,
                labels,
              })
            ) : (
              <FileTreeDeleteConfirm
                open={true}
                ids={pendingDeleteIds}
                nodes={pendingNodes}
                labels={labels}
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
              />
            )
          ) : null}
        </div>
       </TooltipProvider>
      </FileTreeContext.Provider>
    );
  },
);

FileTree.displayName = "FileTree";

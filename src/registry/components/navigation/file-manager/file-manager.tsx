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
  DEFAULT_FILE_MANAGER_LABELS,
  type FileManagerActions,
  type FileManagerHandle,
  type FileManagerItem,
  type FileManagerProps,
  type FileManagerState,
  type FileManagerToolbarContext,
  type FsNode,
} from "./types";
import {
  FileManagerContext,
  type FileManagerContextValue,
} from "./hooks/use-file-manager-context";
import { useCurrentFolder } from "./hooks/use-current-folder";
import { useSelection } from "./hooks/use-selection";
import { useClipboard } from "./hooks/use-clipboard";
import { useSortSearch } from "./hooks/use-sort-search";
import { useVisibleItems } from "./hooks/use-visible-items";
import { useLazyLoad } from "./hooks/use-lazy-load";
import { useDrag } from "./hooks/use-drag";
import { useKeyboard } from "./hooks/use-keyboard";
import { useMarquee } from "./hooks/use-marquee";
import {
  countAllNodes,
  findNode,
  indexNodes,
} from "./lib/tree-utils";
import { validateNodes } from "./lib/validation";
import { FileManagerToolbar } from "./parts/file-manager-toolbar";
import { FileManagerContentPane } from "./parts/file-manager-content-pane";
import { FileManagerStatusBar } from "./parts/file-manager-status-bar";
import { FileManagerDragOverlay } from "./parts/file-manager-drag-overlay";
import { FileManagerDeleteConfirm } from "./parts/file-manager-delete-confirm";
import { FileManagerContextMenu } from "./parts/file-manager-context-menu";

const LIST_ROW_HEIGHT = 32;

export const FileManager = forwardRef<
  FileManagerHandle,
  FileManagerProps
>(function FileManager(props, ref) {
  const {
    nodes,
    currentFolderId: controlledFolderId,
    defaultCurrentFolderId,
    onCurrentFolderChange,
    onLoadChildren,
    selectedIds,
    defaultSelectedIds,
    onSelectedChange,
    preserveSelectionOnNavigate = false,
    clipboard,
    defaultClipboard,
    onClipboardChange,
    onOpen,
    onCreate,
    onRename,
    onDelete,
    onMove,
    onPaste,
    onRefresh,
    onExternalDrop,
    validateRename,
    viewMode,
    defaultViewMode,
    onViewModeChange,
    iconSize,
    defaultIconSize,
    onIconSizeChange,
    sort,
    defaultSort,
    onSortChange,
    sortItems,
    searchQuery,
    defaultSearchQuery,
    onSearchQueryChange,
    filterItems,
    showHidden = false,
    isHidden,
    enableHistory = true,
    historyBackIds,
    historyForwardIds,
    onPathTyped,
    iconForNode,
    renderItem,
    renderToolbar,
    renderContextMenu,
    renderEmpty,
    renderLoading,
    renderStatusBar,
    renderDeleteConfirm,
    sidebar,
    details,
    toolbar = true,
    title,
    showNewFile = true,
    showNewFolder = true,
    showRefresh = true,
    showSearch = true,
    showViewToggle = true,
    showIconSize = true,
    showSort = true,
    showBackForward = true,
    showUpButton = true,
    showPathBar = true,
    showStatusBar = true,
    contextMenu = true,
    contextMenuActions,
    confirmDelete = true,
    enableInternalDrag = true,
    enableExternalDrop = true,
    enableMarqueeSelection = true,
    virtualize = "auto",
    virtualizeThreshold = 200,
    className,
    style,
    labels: labelsOverride,
  } = props;

  // Merge labels
  const labels = useMemo(
    () => ({ ...DEFAULT_FILE_MANAGER_LABELS, ...labelsOverride }),
    [labelsOverride],
  );

  // Index nodes once per `nodes` change
  const nodeIndex = useMemo(() => indexNodes(nodes), [nodes]);

  // Validate nodes (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const warnings = validateNodes(nodes);
    for (const w of warnings) {
      console.warn("[file-manager]", w);
    }
  }, [nodes]);

  // Pending delete state
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  // Sort + search + view mode + icon size
  const sortSearch = useSortSearch({
    controlledSort: sort,
    defaultSort,
    onSortChange,
    controlledSearch: searchQuery,
    defaultSearch: defaultSearchQuery,
    onSearchChange: onSearchQueryChange,
    controlledViewMode: viewMode,
    defaultViewMode,
    onViewModeChange,
    controlledIconSize: iconSize,
    defaultIconSize,
    onIconSizeChange,
  });

  // Current folder + history
  const folder = useCurrentFolder({
    nodes,
    index: nodeIndex,
    controlledFolderId,
    defaultFolderId: defaultCurrentFolderId,
    onCurrentFolderChange,
    enableHistory,
    controlledBack: historyBackIds,
    controlledForward: historyForwardIds,
  });

  // Clipboard
  const clipboardHook = useClipboard({
    controlledClipboard: clipboard,
    defaultClipboard,
    onClipboardChange,
  });

  // Selection
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const selection = useSelection({
    controlledIds: selectedIds,
    defaultIds: defaultSelectedIds,
    onSelectedChange,
    index: nodeIndex,
  });

  // Lazy load
  const lazy = useLazyLoad({
    nodes,
    currentFolderId: folder.currentFolderId,
    index: nodeIndex,
    onLoadChildren,
  });

  // Visible items (filter + sort + flatten)
  const { items, totalSize, visibleCount } = useVisibleItems({
    nodes,
    index: nodeIndex,
    currentFolderId: folder.currentFolderId,
    selectedIds: selection.selectedIds,
    focusedId,
    clipboard: clipboardHook.clipboard,
    sort: sortSearch.sort,
    searchQuery: sortSearch.searchQuery,
    showHidden,
    isHidden,
    filterItems,
    sortItems,
  });

  // Drag
  const drag = useDrag({
    nodes,
    currentFolderId: folder.currentFolderId,
    enableInternalDrag,
    enableExternalDrop,
    selectedIds: selection.selectedIds,
    onMove,
    onExternalDrop,
    selectIds: (idOrIds) => selection.select(idOrIds),
  });

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<number>(1);

  // Marquee selection
  const marquee = useMarquee({
    enabled: enableMarqueeSelection,
    applySelection: (ids) => {
      selection.select(ids);
    },
    snapshotSelection: () => new Set(selection.selectedIds),
    containerRef: scrollRef,
  });

  // ── Actions ────────────────────────────────────────────────────────────
  const triggerDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      if (confirmDelete) {
        setPendingDeleteIds(ids);
        return;
      }
      onDelete?.({ ids });
    },
    [confirmDelete, onDelete],
  );

  const triggerOpen = useCallback(
    (id: string) => {
      const node = findNode(id, nodes);
      if (!node) return;
      if (node.type === "folder") {
        if (!preserveSelectionOnNavigate) selection.clearSelection();
        folder.navigateTo(id);
      } else {
        onOpen?.({ node });
      }
    },
    [nodes, folder, onOpen, preserveSelectionOnNavigate, selection],
  );

  const paste = useCallback(() => {
    const cb = clipboardHook.clipboard;
    if (!cb.kind || cb.ids.length === 0) return;
    onPaste?.({
      ids: cb.ids,
      kind: cb.kind,
      targetFolderId: folder.currentFolderId,
    });
    if (cb.kind === "cut") {
      clipboardHook.clearClipboard();
    }
  }, [clipboardHook, onPaste, folder.currentFolderId]);

  // Wrap navigation to clear selection on navigate (unless preserved).
  const maybeClearSelection = useCallback(() => {
    if (!preserveSelectionOnNavigate) selection.clearSelection();
  }, [preserveSelectionOnNavigate, selection]);

  const navigateTo = useCallback(
    (id: string | null) => {
      maybeClearSelection();
      folder.navigateTo(id);
    },
    [maybeClearSelection, folder],
  );
  const navigateUp = useCallback(() => {
    maybeClearSelection();
    folder.navigateUp();
  }, [maybeClearSelection, folder]);
  const navigateBack = useCallback(() => {
    maybeClearSelection();
    folder.navigateBack();
  }, [maybeClearSelection, folder]);
  const navigateForward = useCallback(() => {
    maybeClearSelection();
    folder.navigateForward();
  }, [maybeClearSelection, folder]);

  const actions: FileManagerActions = useMemo(
    () => ({
      navigateTo,
      navigateUp,
      navigateBack,
      navigateForward,
      refresh: (nodeId = null) => onRefresh?.({ nodeId }),
      setViewMode: sortSearch.setViewMode,
      setIconSize: sortSearch.setIconSize,
      setSort: sortSearch.setSort,
      setSearchQuery: sortSearch.setSearchQuery,
      select: selection.select,
      toggleSelection: selection.toggleSelection,
      clearSelection: selection.clearSelection,
      selectAll: () =>
        selection.selectAll(items.map((i) => i.node.id)),
      focusNode: (id) => setFocusedId(id),
      startRename: (id) => setRenamingId(id),
      cancelRename: () => setRenamingId(null),
      triggerCreate: (type) =>
        onCreate?.({ parentId: folder.currentFolderId, type }),
      triggerDelete,
      triggerOpen,
      cut: clipboardHook.cut,
      copy: clipboardHook.copy,
      paste,
      clearClipboard: clipboardHook.clearClipboard,
    }),
    [
      navigateTo,
      navigateUp,
      navigateBack,
      navigateForward,
      folder.currentFolderId,
      sortSearch,
      selection,
      items,
      onRefresh,
      onCreate,
      triggerDelete,
      triggerOpen,
      clipboardHook,
      paste,
    ],
  );

  // ── State ──────────────────────────────────────────────────────────────
  const state: FileManagerState = useMemo(
    () => ({
      currentFolderId: folder.currentFolderId,
      selectedIds: selection.selectedIds,
      focusedId,
      renamingId,
      viewMode: sortSearch.viewMode,
      iconSize: sortSearch.iconSize,
      sort: sortSearch.sort,
      searchQuery: sortSearch.searchQuery,
      path: folder.path,
      loadingChildren: lazy.loadingChildren,
      loadError: lazy.loadError,
      clipboard: clipboardHook.clipboard,
      historyBackIds: folder.historyBackIds,
      historyForwardIds: folder.historyForwardIds,
    }),
    [
      folder.currentFolderId,
      folder.path,
      folder.historyBackIds,
      folder.historyForwardIds,
      selection.selectedIds,
      focusedId,
      renamingId,
      sortSearch.viewMode,
      sortSearch.iconSize,
      sortSearch.sort,
      sortSearch.searchQuery,
      lazy.loadingChildren,
      lazy.loadError,
      clipboardHook.clipboard,
    ],
  );

  // Imperative handle
  useImperativeHandle(
    ref,
    () => ({ state, actions }),
    [state, actions],
  );

  // Keyboard
  const kb = useKeyboard({
    items,
    focusedId,
    renamingId,
    selectedIds: selection.selectedIds,
    viewMode: sortSearch.viewMode,
    columnsRef,
    actions,
    onOpen,
  });

  // ── Item callbacks (click / dblclick / contextmenu) ───────────────────
  const onItemClick = useCallback(
    (e: MouseEvent, item: FileManagerItem) => {
      if (e.metaKey || e.ctrlKey) {
        selection.toggleSelection(item.node.id);
        selection.setSelectionAnchorId(item.node.id);
      } else if (e.shiftKey) {
        const anchor = selection.getSelectionAnchorId();
        if (!anchor) {
          selection.select(item.node.id);
          selection.setSelectionAnchorId(item.node.id);
        } else {
          const aIdx = items.findIndex((i) => i.node.id === anchor);
          const bIdx = items.findIndex((i) => i.node.id === item.node.id);
          if (aIdx !== -1 && bIdx !== -1) {
            const [from, to] = aIdx < bIdx ? [aIdx, bIdx] : [bIdx, aIdx];
            const ids = items.slice(from, to + 1).map((i) => i.node.id);
            selection.select(ids);
          }
        }
      } else {
        selection.select(item.node.id);
        selection.setSelectionAnchorId(item.node.id);
      }
      setFocusedId(item.node.id);
    },
    [items, selection],
  );

  const onItemDoubleClick = useCallback(
    (_e: MouseEvent, item: FileManagerItem) => {
      if (item.node.type === "folder") {
        folder.navigateTo(item.node.id);
      } else {
        onOpen?.({ node: item.node });
      }
    },
    [folder, onOpen],
  );

  const onItemContextMenu = useCallback(
    (_e: MouseEvent, item: FileManagerItem) => {
      if (!selection.selectedIds.has(item.node.id)) {
        selection.select(item.node.id);
      }
      setFocusedId(item.node.id);
    },
    [selection],
  );

  const onRenameCommit = useCallback(
    (id: string, nextName: string) => {
      const node = findNode(id, nodes);
      if (node && onRename) onRename({ id, node, nextName });
      setRenamingId(null);
    },
    [nodes, onRename],
  );

  const onRenameCancel = useCallback(() => setRenamingId(null), []);

  // ── Header / toolbar context ──────────────────────────────────────────
  const headerCtx: FileManagerToolbarContext = useMemo(
    () => ({
      state,
      actions,
      showNewFile,
      showNewFolder,
      showRefresh,
      showSearch,
      showViewToggle,
      showIconSize,
      showSort,
      showBackForward,
      showUpButton,
      showPathBar,
      title,
      labels,
    }),
    [
      state,
      actions,
      showNewFile,
      showNewFolder,
      showRefresh,
      showSearch,
      showViewToggle,
      showIconSize,
      showSort,
      showBackForward,
      showUpButton,
      showPathBar,
      title,
      labels,
    ],
  );

  // ── Pending delete dialog ─────────────────────────────────────────────
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

  // ── Public Context value ──────────────────────────────────────────────
  const totalCount = useMemo(() => countAllNodes(nodes), [nodes]);
  const ctxValue: FileManagerContextValue = useMemo(
    () => ({
      state,
      actions,
      items,
      totalCount,
      visibleCount,
      totalSize,
      showNewFile,
      showNewFolder,
      showRefresh,
      showSearch,
      showViewToggle,
      showIconSize,
      showSort,
      showBackForward,
      showUpButton,
      showPathBar,
      showStatusBar,
      title,
      labels,
    }),
    [
      state,
      actions,
      items,
      totalCount,
      visibleCount,
      totalSize,
      showNewFile,
      showNewFolder,
      showRefresh,
      showSearch,
      showViewToggle,
      showIconSize,
      showSort,
      showBackForward,
      showUpButton,
      showPathBar,
      showStatusBar,
      title,
      labels,
    ],
  );

  // ── Render ────────────────────────────────────────────────────────────
  const isEmpty =
    !lazy.loadingChildren && !lazy.loadError && items.length === 0;

  const contextMenuGates = {
    open: contextMenuActions?.open ?? true,
    newFile: contextMenuActions?.newFile ?? true,
    newFolder: contextMenuActions?.newFolder ?? true,
    cut: contextMenuActions?.cut ?? true,
    copy: contextMenuActions?.copy ?? true,
    paste: contextMenuActions?.paste ?? true,
    rename: contextMenuActions?.rename ?? true,
    delete: contextMenuActions?.delete ?? true,
    refresh: contextMenuActions?.refresh ?? true,
  };
  const wired = {
    onOpen: !!onOpen,
    onCreate: !!onCreate,
    onRename: !!onRename,
    onDelete: !!onDelete,
    onMove: !!onMove,
    onPaste: !!onPaste,
    onRefresh: !!onRefresh,
  };

  return (
    <FileManagerContext.Provider value={ctxValue}>
      <TooltipProvider delayDuration={400}>
        <div
          role="region"
          aria-label={title ?? labels.title}
          tabIndex={focusedId === null ? 0 : -1}
          className={cn(
            "relative flex h-full w-full overflow-hidden rounded-md border border-border/60 bg-background text-foreground outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
          style={style}
          onKeyDown={kb.onKeyDown}
        >
          {sidebar ? (
            <aside className="flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/30">
              {sidebar}
            </aside>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col">
            {toolbar
              ? renderToolbar
                ? renderToolbar(headerCtx)
                : <FileManagerToolbar onPathTyped={onPathTyped} />
              : null}
            <FileManagerContextMenu
              state={state}
              actions={actions}
              enabled={contextMenu}
              labels={labels}
              gates={contextMenuGates}
              wired={wired}
              nodeIndex={nodeIndex}
              renderContextMenu={renderContextMenu}
            >
              <FileManagerContentPane
                items={items}
                viewMode={sortSearch.viewMode}
                iconSize={sortSearch.iconSize}
                rowHeight={LIST_ROW_HEIGHT}
                sort={sortSearch.sort}
                onSetSort={sortSearch.setSort}
                renamingId={renamingId}
                validateRename={validateRename}
                iconForNode={iconForNode}
                enableInternalDrag={enableInternalDrag}
                enableMarqueeSelection={enableMarqueeSelection}
                dropTargetId={drag.dragOver?.itemId ?? null}
                dropInvalid={drag.dragOver ? !drag.dragOver.valid : false}
                loading={lazy.loadingChildren}
                loadError={lazy.loadError}
                onRetryLoad={lazy.retry}
                isEmpty={isEmpty}
                marqueeRect={marquee.rect}
                marqueeActive={marquee.active}
                onMarqueePointerDown={marquee.onPointerDown}
                scrollRef={scrollRef}
                columnsRef={columnsRef}
                virtualize={virtualize}
                virtualizeThreshold={virtualizeThreshold}
                renderItem={renderItem}
                renderEmpty={
                  renderEmpty
                    ? () =>
                        renderEmpty({
                          actions,
                          showNewFile,
                          showNewFolder,
                          labels,
                        })
                    : undefined
                }
                renderLoading={renderLoading}
                labels={labels}
                onItemClick={onItemClick}
                onItemDoubleClick={onItemDoubleClick}
                onItemContextMenu={onItemContextMenu}
                onRenameCommit={onRenameCommit}
                onRenameCancel={onRenameCancel}
                onItemDragStart={drag.onItemDragStart}
                onItemDragOver={drag.onItemDragOver}
                onItemDragLeave={drag.onItemDragLeave}
                onItemDrop={drag.onItemDrop}
                onItemDragEnd={drag.onItemDragEnd}
                onContainerDragEnter={drag.onContainerDragEnter}
                onContainerDragOver={drag.onContainerDragOver}
                onContainerDragLeave={drag.onContainerDragLeave}
                onContainerDrop={drag.onContainerDrop}
              />
            </FileManagerContextMenu>
            {showStatusBar
              ? renderStatusBar
                ? renderStatusBar({
                    state,
                    actions,
                    totalCount,
                    selectedCount: selection.selectedIds.size,
                    totalSize,
                    labels,
                  })
                : <FileManagerStatusBar />
              : null}
          </div>
          {details ? (
            <aside className="flex w-72 min-w-70 shrink-0 flex-col border-l border-border/60 bg-card/30">
              {details}
            </aside>
          ) : null}
          <FileManagerDragOverlay
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
              <FileManagerDeleteConfirm
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
    </FileManagerContext.Provider>
  );
});

FileManager.displayName = "FileManager";

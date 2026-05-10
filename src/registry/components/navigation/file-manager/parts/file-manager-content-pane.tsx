"use client";

import {
  useCallback,
  useEffect,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import type {
  FileManagerIconSize,
  FileManagerItem,
  FileManagerItemRenderArgs,
  FileManagerLabels,
  FileManagerSortState,
  FileManagerValidateRenameArgs,
  FileManagerViewMode,
  FileManagerVirtualizeMode,
  FsNode,
} from "../types";
import type { MarqueeRect } from "../hooks/use-marquee";
import { FileManagerGridView } from "./file-manager-grid-view";
import { FileManagerListView } from "./file-manager-list-view";
import { FileManagerMarquee } from "./file-manager-marquee";
import { FileManagerEmpty } from "./file-manager-empty";
import { FileManagerLoading } from "./file-manager-loading";

interface FileManagerContentPaneProps {
  items: FileManagerItem[];
  viewMode: FileManagerViewMode;
  iconSize: FileManagerIconSize;
  rowHeight: number;
  sort: FileManagerSortState;
  onSetSort: (next: FileManagerSortState) => void;
  renamingId: string | null;
  validateRename?: (args: FileManagerValidateRenameArgs) => string | null;
  iconForNode?: (args: { node: FsNode }) => ReactNode;
  enableInternalDrag: boolean;
  enableMarqueeSelection: boolean;
  dropTargetId: string | null;
  dropInvalid: boolean;
  loading: boolean;
  loadError: string | null;
  onRetryLoad: () => void;
  isEmpty: boolean;
  marqueeRect: MarqueeRect | null;
  marqueeActive: boolean;
  onMarqueePointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Computed columns ref for keyboard 2D-arrow nav. */
  columnsRef: React.MutableRefObject<number>;
  /** Virtualization config — applied by list view internally. */
  virtualize: FileManagerVirtualizeMode;
  virtualizeThreshold: number;
  renderItem?: (args: FileManagerItemRenderArgs) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderLoading?: () => ReactNode;
  labels: FileManagerLabels;
  // Item-level callbacks
  onItemClick: (e: MouseEvent, item: FileManagerItem) => void;
  onItemDoubleClick: (e: MouseEvent, item: FileManagerItem) => void;
  onItemContextMenu: (e: MouseEvent, item: FileManagerItem) => void;
  onRenameCommit: (id: string, nextName: string) => void;
  onRenameCancel: () => void;
  onItemDragStart?: (e: DragEvent, item: FileManagerItem) => void;
  onItemDragOver?: (e: DragEvent, item: FileManagerItem) => void;
  onItemDragLeave?: (e: DragEvent, item: FileManagerItem) => void;
  onItemDrop?: (e: DragEvent, item: FileManagerItem) => void;
  onItemDragEnd?: (e: DragEvent, item: FileManagerItem) => void;
  // Container handlers (for whitespace context-menu + drop)
  onContainerContextMenu?: (e: MouseEvent) => void;
  onContainerDragEnter?: (e: DragEvent) => void;
  onContainerDragOver?: (e: DragEvent) => void;
  onContainerDragLeave?: (e: DragEvent) => void;
  onContainerDrop?: (e: DragEvent) => void;
}

const TRACK_PX_BY_SIZE: Record<FileManagerIconSize, number> = {
  sm: 80,
  md: 120,
  lg: 180,
};

export function FileManagerContentPane(props: FileManagerContentPaneProps) {
  const {
    items,
    viewMode,
    iconSize,
    rowHeight,
    sort,
    onSetSort,
    renamingId,
    validateRename,
    iconForNode,
    enableInternalDrag,
    enableMarqueeSelection,
    dropTargetId,
    dropInvalid,
    loading,
    loadError,
    onRetryLoad,
    isEmpty,
    marqueeRect,
    marqueeActive,
    onMarqueePointerDown,
    scrollRef,
    columnsRef,
    virtualize,
    virtualizeThreshold,
    renderItem,
    renderEmpty,
    renderLoading,
    labels,
    onItemClick,
    onItemDoubleClick,
    onItemContextMenu,
    onRenameCommit,
    onRenameCancel,
    onItemDragStart,
    onItemDragOver,
    onItemDragLeave,
    onItemDrop,
    onItemDragEnd,
    onContainerContextMenu,
    onContainerDragEnter,
    onContainerDragOver,
    onContainerDragLeave,
    onContainerDrop,
  } = props;

  // Compute column count for keyboard arrow nav (grid mode)
  const recomputeColumns = useCallback(() => {
    const el = scrollRef.current;
    if (!el || viewMode !== "grid") {
      columnsRef.current = 1;
      return;
    }
    const trackPx = TRACK_PX_BY_SIZE[iconSize];
    const gap = 4; // matches `gap-1` in grid view
    const availableWidth = el.clientWidth - 16; // p-2 padding
    const cols = Math.max(
      1,
      Math.floor((availableWidth + gap) / (trackPx + gap)),
    );
    columnsRef.current = cols;
  }, [scrollRef, viewMode, iconSize, columnsRef]);

  useEffect(() => {
    recomputeColumns();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recomputeColumns);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recomputeColumns, scrollRef]);

  // Pointer-down dispatch — only fire marquee if NOT on an item
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enableMarqueeSelection) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-item-id]")) return; // item handles its own drag
    onMarqueePointerDown(e);
  };

  return (
    <div
      ref={scrollRef}
      data-file-manager-scroller
      className="relative h-full flex-1 overflow-y-auto overflow-x-hidden"
      onPointerDown={handlePointerDown}
      onContextMenu={onContainerContextMenu}
      onDragEnter={onContainerDragEnter}
      onDragOver={onContainerDragOver}
      onDragLeave={onContainerDragLeave}
      onDrop={onContainerDrop}
      style={{ userSelect: marqueeActive ? "none" : undefined }}
    >
      {loading ? (
        renderLoading?.() ?? <FileManagerLoading />
      ) : loadError ? (
        <div className="flex h-full items-center justify-center px-4 py-8 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">
              {labels.loadError}
            </p>
            <p className="text-xs text-muted-foreground">{loadError}</p>
            <button
              type="button"
              onClick={onRetryLoad}
              className="rounded-sm border border-border px-2 py-1 text-xs hover:bg-muted/60"
            >
              {labels.retry}
            </button>
          </div>
        </div>
      ) : isEmpty ? (
        renderEmpty?.() ?? <FileManagerEmpty />
      ) : viewMode === "grid" ? (
        <FileManagerGridView
          items={items}
          iconSize={iconSize}
          renamingId={renamingId}
          validateRename={validateRename}
          iconForNode={iconForNode}
          enableInternalDrag={enableInternalDrag}
          dropTargetId={dropTargetId}
          dropInvalid={dropInvalid}
          renderItem={renderItem}
          onItemClick={onItemClick}
          onItemDoubleClick={onItemDoubleClick}
          onItemContextMenu={onItemContextMenu}
          onRenameCommit={onRenameCommit}
          onRenameCancel={onRenameCancel}
          onItemDragStart={onItemDragStart}
          onItemDragOver={onItemDragOver}
          onItemDragLeave={onItemDragLeave}
          onItemDrop={onItemDrop}
          onItemDragEnd={onItemDragEnd}
        />
      ) : (
        <FileManagerListView
          items={items}
          rowHeight={rowHeight}
          sort={sort}
          onSetSort={onSetSort}
          renamingId={renamingId}
          validateRename={validateRename}
          iconForNode={iconForNode}
          enableInternalDrag={enableInternalDrag}
          dropTargetId={dropTargetId}
          dropInvalid={dropInvalid}
          renderItem={renderItem}
          labels={labels}
          scrollRef={scrollRef}
          virtualize={virtualize}
          virtualizeThreshold={virtualizeThreshold}
          onItemClick={onItemClick}
          onItemDoubleClick={onItemDoubleClick}
          onItemContextMenu={onItemContextMenu}
          onRenameCommit={onRenameCommit}
          onRenameCancel={onRenameCancel}
          onItemDragStart={onItemDragStart}
          onItemDragOver={onItemDragOver}
          onItemDragLeave={onItemDragLeave}
          onItemDrop={onItemDrop}
          onItemDragEnd={onItemDragEnd}
        />
      )}
      <FileManagerMarquee rect={marqueeRect} />
    </div>
  );
}

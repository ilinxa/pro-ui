"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import type {
  FileManagerItem,
  FileManagerItemRenderArgs,
  FileManagerLabels,
  FileManagerSortKey,
  FileManagerSortState,
  FileManagerValidateRenameArgs,
  FileManagerVirtualizeMode,
  FsNode,
} from "../types";
import { FileManagerItemView } from "./file-manager-item";

interface FileManagerListViewProps {
  items: FileManagerItem[];
  rowHeight: number;
  sort: FileManagerSortState;
  onSetSort: (next: FileManagerSortState) => void;
  renamingId: string | null;
  validateRename?: (args: FileManagerValidateRenameArgs) => string | null;
  iconForNode?: (args: { node: FsNode }) => ReactNode;
  enableInternalDrag: boolean;
  dropTargetId: string | null;
  dropInvalid: boolean;
  renderItem?: (args: FileManagerItemRenderArgs) => ReactNode;
  labels: FileManagerLabels;
  /** Scroll container ref. Required for virtualization measurements. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Virtualization mode: 'auto' engages above `virtualizeThreshold`. */
  virtualize: FileManagerVirtualizeMode;
  virtualizeThreshold: number;
  // shared callbacks
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
}

function HeaderCell({
  active,
  order,
  onClick,
  className,
  children,
}: {
  active: boolean;
  order: "asc" | "desc";
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="columnheader"
      aria-sort={
        active ? (order === "asc" ? "ascending" : "descending") : "none"
      }
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 truncate text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
      {active ? (
        order === "asc" ? (
          <ChevronUp className="size-3" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-3" aria-hidden="true" />
        )
      ) : (
        <ChevronsUpDown className="size-3 opacity-40" aria-hidden="true" />
      )}
    </button>
  );
}

export function FileManagerListView(props: FileManagerListViewProps) {
  const {
    items,
    rowHeight,
    sort,
    onSetSort,
    renamingId,
    validateRename,
    iconForNode,
    enableInternalDrag,
    dropTargetId,
    dropInvalid,
    renderItem,
    labels,
    scrollRef,
    virtualize,
    virtualizeThreshold,
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
  } = props;

  // Own the virtualizer locally — keeps virtualizer state inside this
  // component's scope so React Compiler doesn't strand stale measurements
  // across cross-component prop boundaries.
  const virtualizationActive =
    virtualize === "always" ||
    (virtualize === "auto" && items.length >= virtualizeThreshold);

  // Sync the scroll element ref into local state so `useVirtualizer` picks it
  // up on the second render (refs alone don't trigger re-render, which leaves
  // the virtualizer with a null scroll element and zero measured viewport).
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(
    () => scrollRef.current,
  );
  useEffect(() => {
    if (scrollRef.current && scrollRef.current !== scrollEl) {
      setScrollEl(scrollRef.current);
    }
  }, [scrollRef, scrollEl]);

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: items.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => rowHeight,
    overscan: 8,
    enabled: virtualizationActive,
  });

  const toggleSort = (key: FileManagerSortKey) => {
    if (sort.key === key) {
      onSetSort({ key, order: sort.order === "asc" ? "desc" : "asc" });
    } else {
      onSetSort({ key, order: "asc" });
    }
  };

  const headerRow = (
    <div
      role="row"
      className="sticky top-0 z-10 flex h-8 items-center gap-2 border-b border-border/60 bg-card/90 px-2 backdrop-blur-sm"
    >
      <span aria-hidden="true" className="size-4 shrink-0" />
      <HeaderCell
        active={sort.key === "name"}
        order={sort.order}
        onClick={() => toggleSort("name")}
        className="flex-1"
      >
        {labels.columnName}
      </HeaderCell>
      <HeaderCell
        active={sort.key === "modified"}
        order={sort.order}
        onClick={() => toggleSort("modified")}
        className="hidden w-32 shrink-0 sm:flex"
      >
        {labels.columnModified}
      </HeaderCell>
      <HeaderCell
        active={sort.key === "size"}
        order={sort.order}
        onClick={() => toggleSort("size")}
        className="hidden w-20 shrink-0 justify-end sm:flex"
      >
        {labels.columnSize}
      </HeaderCell>
      <HeaderCell
        active={sort.key === "type"}
        order={sort.order}
        onClick={() => toggleSort("type")}
        className="hidden w-16 shrink-0 md:flex"
      >
        {labels.columnType}
      </HeaderCell>
    </div>
  );

  const buildRow = (item: FileManagerItem, outerStyle?: CSSProperties) => {
    const isDropTarget = dropTargetId === item.node.id;
    const defaultItem = (
      <FileManagerItemView
        item={item}
        viewMode="list"
        iconSize="sm"
        isRenaming={renamingId === item.node.id}
        validateRename={validateRename}
        iconForNode={iconForNode}
        enableInternalDrag={enableInternalDrag}
        isDropTarget={isDropTarget}
        dropInvalid={isDropTarget && dropInvalid}
        onClick={onItemClick}
        onDoubleClick={onItemDoubleClick}
        onContextMenu={onItemContextMenu}
        onRenameCommit={onRenameCommit}
        onRenameCancel={onRenameCancel}
        onDragStart={onItemDragStart}
        onDragOver={onItemDragOver}
        onDragLeave={onItemDragLeave}
        onDrop={onItemDrop}
        onDragEnd={onItemDragEnd}
        outerStyle={
          outerStyle
            ? { ...outerStyle, height: `${rowHeight}px` }
            : { height: `${rowHeight}px` }
        }
      />
    );
    if (renderItem) {
      return (
        <div
          key={item.node.id}
          style={outerStyle}
          role="row"
        >
          {renderItem({ item, defaultItem, viewMode: "list" })}
        </div>
      );
    }
    return (
      <div
        key={item.node.id}
        role="row"
      >
        {defaultItem}
      </div>
    );
  };

  if (virtualizationActive) {
    const totalHeight = virtualizer.getTotalSize();
    const virtualItems = virtualizer.getVirtualItems();
    return (
      <div role="grid" aria-multiselectable="true">
        {headerRow}
        <div style={{ height: `${totalHeight}px`, position: "relative" }}>
          {virtualItems.map((vi) => {
            const item = items[vi.index];
            if (!item) return null;
            const outerStyle: CSSProperties = {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start}px)`,
            };
            return buildRow(item, outerStyle);
          })}
        </div>
      </div>
    );
  }

  return (
    <div role="grid" aria-multiselectable="true">
      {headerRow}
      <div className="flex flex-col">
        {items.map((item) => buildRow(item))}
      </div>
    </div>
  );
}

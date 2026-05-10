"use client";

import type {
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";
import type { Virtualizer } from "@tanstack/react-virtual";
import type {
  FileTreeDropPosition,
  FileTreeLabels,
  FileTreeRow,
  FileTreeRowRenderArgs,
  FileTreeValidateRenameArgs,
  FsNode,
} from "../types";
import { FileTreeRowView } from "./file-tree-row";

export interface DragOverState {
  rowId: string;
  position: FileTreeDropPosition | null;
  valid: boolean;
}

interface FileTreeRowListProps {
  rows: FileTreeRow[];
  rowHeight: number;
  indent: number;
  indentGuides: boolean;
  iconForNode?: (args: { node: FsNode }) => ReactNode;
  renamingId: string | null;
  validateRename?: (args: FileTreeValidateRenameArgs) => string | null;
  enableInternalDrag: boolean;
  dragOver: DragOverState | null;
  loadErrors: ReadonlyMap<string, string>;
  onRetryLoad?: (nodeId: string) => void;
  labels: FileTreeLabels;
  /** Active virtualizer (if virtualization is on; else undefined). */
  virtualizer?: Virtualizer<HTMLDivElement, HTMLDivElement>;
  scrollRef: Ref<HTMLDivElement>;
  /** Render-row slot — when provided, replaces the default row rendering. */
  renderRow?: (args: FileTreeRowRenderArgs) => ReactNode;
  // Shared callbacks
  onRowClick: (e: MouseEvent, row: FileTreeRow) => void;
  onChevronClick: (e: MouseEvent, row: FileTreeRow) => void;
  onRowDoubleClick: (e: MouseEvent, row: FileTreeRow) => void;
  onRowContextMenu: (e: MouseEvent, row: FileTreeRow) => void;
  onRenameCommit: (id: string, nextName: string) => void;
  onRenameCancel: () => void;
  onRowDragStart?: (e: React.DragEvent, row: FileTreeRow) => void;
  onRowDragOver?: (e: React.DragEvent, row: FileTreeRow) => void;
  onRowDragLeave?: (e: React.DragEvent, row: FileTreeRow) => void;
  onRowDrop?: (e: React.DragEvent, row: FileTreeRow) => void;
  onRowDragEnd?: (e: React.DragEvent, row: FileTreeRow) => void;
  onRowKeyDown?: (e: KeyboardEvent<HTMLDivElement>, row: FileTreeRow) => void;
  /** Container-level drop fallback (when drop hits the empty whitespace). */
  onContainerDragOver?: (e: React.DragEvent) => void;
  onContainerDrop?: (e: React.DragEvent) => void;
  onContainerContextMenu?: (e: MouseEvent) => void;
}

export function FileTreeRowList(props: FileTreeRowListProps) {
  const {
    rows,
    rowHeight,
    indent,
    indentGuides,
    iconForNode,
    renamingId,
    validateRename,
    enableInternalDrag,
    dragOver,
    loadErrors,
    onRetryLoad,
    labels,
    virtualizer,
    scrollRef,
    renderRow,
    onRowClick,
    onChevronClick,
    onRowDoubleClick,
    onRowContextMenu,
    onRenameCommit,
    onRenameCancel,
    onRowDragStart,
    onRowDragOver,
    onRowDragLeave,
    onRowDrop,
    onRowDragEnd,
    onRowKeyDown,
    onContainerDragOver,
    onContainerDrop,
    onContainerContextMenu,
  } = props;

  const buildRow = (
    row: FileTreeRow,
    outerStyle?: React.CSSProperties,
  ): ReactNode => {
    const dropPosition =
      dragOver?.rowId === row.node.id ? dragOver.position : null;
    const dropInvalid =
      dragOver?.rowId === row.node.id ? !dragOver.valid : false;
    const error = loadErrors.get(row.node.id);

    if (renderRow) {
      // When a slot replaces the row contents, the outer wrapper carries the
      // virtualized positioning. The default row passed in does NOT.
      const defaultRow = (
        <FileTreeRowView
          row={row}
          rowHeight={rowHeight}
          indent={indent}
          indentGuides={indentGuides}
          iconForNode={iconForNode}
          isRenaming={renamingId === row.node.id}
          validateRename={validateRename}
          enableInternalDrag={enableInternalDrag}
          dropPosition={dropPosition}
          dropInvalid={dropInvalid}
          loadError={error}
          onRetryLoad={
            onRetryLoad ? () => onRetryLoad(row.node.id) : undefined
          }
          labels={labels}
          onClick={onRowClick}
          onChevronClick={onChevronClick}
          onDoubleClick={onRowDoubleClick}
          onContextMenu={onRowContextMenu}
          onRenameCommit={onRenameCommit}
          onRenameCancel={onRenameCancel}
          onDragStart={onRowDragStart}
          onDragOver={onRowDragOver}
          onDragLeave={onRowDragLeave}
          onDrop={onRowDrop}
          onDragEnd={onRowDragEnd}
          onRowKeyDown={onRowKeyDown}
        />
      );
      return (
        <div key={row.node.id} style={outerStyle}>
          {renderRow({ row, defaultRow })}
        </div>
      );
    }

    // Default path: no extra wrapper — the row view IS the outer element.
    return (
      <FileTreeRowView
        key={row.node.id}
        row={row}
        rowHeight={rowHeight}
        indent={indent}
        indentGuides={indentGuides}
        iconForNode={iconForNode}
        isRenaming={renamingId === row.node.id}
        validateRename={validateRename}
        enableInternalDrag={enableInternalDrag}
        dropPosition={dropPosition}
        dropInvalid={dropInvalid}
        loadError={error}
        onRetryLoad={
          onRetryLoad ? () => onRetryLoad(row.node.id) : undefined
        }
        labels={labels}
        onClick={onRowClick}
        onChevronClick={onChevronClick}
        onDoubleClick={onRowDoubleClick}
        onContextMenu={onRowContextMenu}
        onRenameCommit={onRenameCommit}
        onRenameCancel={onRenameCancel}
        onDragStart={onRowDragStart}
        onDragOver={onRowDragOver}
        onDragLeave={onRowDragLeave}
        onDrop={onRowDrop}
        onDragEnd={onRowDragEnd}
        onRowKeyDown={onRowKeyDown}
        outerStyle={outerStyle}
      />
    );
  };

  // Virtualized mode
  if (virtualizer && virtualizer.options.enabled) {
    const totalHeight = virtualizer.getTotalSize();
    const items = virtualizer.getVirtualItems();
    return (
      <div
        ref={scrollRef}
        data-file-tree-scroller
        className="relative h-full overflow-y-auto overflow-x-hidden"
        onDragOver={onContainerDragOver}
        onDrop={onContainerDrop}
        onContextMenu={onContainerContextMenu}
      >
        <div
          style={{
            height: `${totalHeight}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {items.map((vi) => {
            const row = rows[vi.index];
            if (!row) return null;
            const outerStyle: React.CSSProperties = {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start}px)`,
            };
            return buildRow(row, outerStyle);
          })}
        </div>
      </div>
    );
  }

  // Naive mode
  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-y-auto overflow-x-hidden"
      onDragOver={onContainerDragOver}
      onDrop={onContainerDrop}
      onContextMenu={onContainerContextMenu}
    >
      <div className="py-1">{rows.map((row) => buildRow(row))}</div>
    </div>
  );
}

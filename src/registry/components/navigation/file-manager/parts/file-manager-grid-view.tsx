"use client";

import type { DragEvent, MouseEvent, ReactNode } from "react";
import type {
  FileManagerIconSize,
  FileManagerItem,
  FileManagerItemRenderArgs,
  FileManagerValidateRenameArgs,
  FsNode,
} from "../types";
import { FileManagerItemView } from "./file-manager-item";

const GRID_TRACK_PX: Record<FileManagerIconSize, number> = {
  sm: 80,
  md: 120,
  lg: 180,
};

interface FileManagerGridViewProps {
  items: FileManagerItem[];
  iconSize: FileManagerIconSize;
  renamingId: string | null;
  validateRename?: (args: FileManagerValidateRenameArgs) => string | null;
  iconForNode?: (args: { node: FsNode }) => ReactNode;
  enableInternalDrag: boolean;
  dropTargetId: string | null;
  dropInvalid: boolean;
  renderItem?: (args: FileManagerItemRenderArgs) => ReactNode;
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

export function FileManagerGridView(props: FileManagerGridViewProps) {
  const {
    items,
    iconSize,
    renamingId,
    validateRename,
    iconForNode,
    enableInternalDrag,
    dropTargetId,
    dropInvalid,
    renderItem,
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

  const trackPx = GRID_TRACK_PX[iconSize];

  return (
    <div
      role="grid"
      aria-multiselectable="true"
      className="grid gap-1 p-2"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${trackPx}px, 1fr))`,
      }}
    >
      {items.map((item) => {
        const isDropTarget = dropTargetId === item.node.id;
        const defaultItem = (
          <FileManagerItemView
            item={item}
            viewMode="grid"
            iconSize={iconSize}
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
          />
        );
        if (renderItem) {
          return (
            <div key={item.node.id}>
              {renderItem({ item, defaultItem, viewMode: "grid" })}
            </div>
          );
        }
        return <div key={item.node.id}>{defaultItem}</div>;
      })}
    </div>
  );
}

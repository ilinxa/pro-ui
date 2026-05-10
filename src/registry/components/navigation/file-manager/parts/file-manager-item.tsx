"use client";

import type {
  CSSProperties,
  DragEvent,
  MouseEvent,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import type {
  FileManagerIconSize,
  FileManagerItem,
  FileManagerValidateRenameArgs,
  FileManagerViewMode,
  FsNode,
} from "../types";
import { defaultFileIcon, defaultFolderIcon } from "../lib/icons";
import { formatBytes, formatDate, formatKind } from "../lib/format";
import { getNodeExtension } from "../lib/icons";
import { FileManagerRenameInput } from "./file-manager-rename-input";

const ICON_SIZE_PX: Record<FileManagerIconSize, number> = {
  sm: 32,
  md: 48,
  lg: 72,
};

const GRID_TRACK_PX: Record<FileManagerIconSize, number> = {
  sm: 80,
  md: 120,
  lg: 180,
};

interface FileManagerItemViewProps {
  item: FileManagerItem;
  viewMode: FileManagerViewMode;
  iconSize: FileManagerIconSize;
  isRenaming: boolean;
  validateRename?: (args: FileManagerValidateRenameArgs) => string | null;
  iconForNode?: (args: { node: FsNode }) => ReactNode;
  enableInternalDrag: boolean;
  /** Drop hover indicator state (only set on the hovered drop target). */
  isDropTarget?: boolean;
  dropInvalid?: boolean;
  // shared callbacks
  onClick: (e: MouseEvent, item: FileManagerItem) => void;
  onDoubleClick: (e: MouseEvent, item: FileManagerItem) => void;
  onContextMenu: (e: MouseEvent, item: FileManagerItem) => void;
  onRenameCommit: (id: string, nextName: string) => void;
  onRenameCancel: () => void;
  onDragStart?: (e: DragEvent, item: FileManagerItem) => void;
  onDragOver?: (e: DragEvent, item: FileManagerItem) => void;
  onDragLeave?: (e: DragEvent, item: FileManagerItem) => void;
  onDrop?: (e: DragEvent, item: FileManagerItem) => void;
  onDragEnd?: (e: DragEvent, item: FileManagerItem) => void;
  /** Used by virtualized list mode to position rows absolutely. */
  outerStyle?: CSSProperties;
}

export function FileManagerItemView(props: FileManagerItemViewProps) {
  const {
    item,
    viewMode,
    iconSize,
    isRenaming,
    validateRename,
    iconForNode,
    enableInternalDrag,
    isDropTarget,
    dropInvalid,
    onClick,
    onDoubleClick,
    onContextMenu,
    onRenameCommit,
    onRenameCancel,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    outerStyle,
  } = props;

  const { node, selected, focused, cut } = item;
  const isFolder = node.type === "folder";
  const ext = getNodeExtension(node);

  const baseIcon = node.icon
    ? node.icon
    : iconForNode
      ? iconForNode({ node })
      : isFolder
        ? defaultFolderIcon(false, "size-full")
        : defaultFileIcon(node, "size-full");

  const sharedProps = {
    "data-item-id": node.id,
    role: "gridcell" as const,
    tabIndex: focused ? 0 : -1,
    "aria-selected": selected,
    draggable: enableInternalDrag && !isRenaming,
    onClick: (e: MouseEvent) => onClick(e, item),
    onDoubleClick: (e: MouseEvent) => onDoubleClick(e, item),
    onContextMenu: (e: MouseEvent) => onContextMenu(e, item),
    onDragStart: (e: DragEvent) =>
      enableInternalDrag && onDragStart && onDragStart(e, item),
    onDragOver: (e: DragEvent) => onDragOver?.(e, item),
    onDragLeave: (e: DragEvent) => onDragLeave?.(e, item),
    onDrop: (e: DragEvent) => onDrop?.(e, item),
    onDragEnd: (e: DragEvent) => onDragEnd?.(e, item),
  };

  if (viewMode === "grid") {
    const trackPx = GRID_TRACK_PX[iconSize];
    const iconPx = ICON_SIZE_PX[iconSize];
    return (
      <div
        {...sharedProps}
        style={outerStyle}
        className={cn(
          "group relative flex cursor-pointer select-none flex-col items-center gap-1.5 rounded-md p-2 outline-none transition-colors",
          selected
            ? "bg-secondary text-secondary-foreground"
            : "hover:bg-muted/60",
          focused &&
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          isDropTarget &&
            !dropInvalid &&
            "ring-2 ring-primary",
          isDropTarget && dropInvalid && "ring-2 ring-destructive",
          cut && "opacity-50",
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center opacity-80 transition-opacity",
            (selected || focused) && "opacity-100",
            "group-hover:opacity-100",
            isFolder
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
            selected && "text-secondary-foreground",
          )}
          style={{ width: iconPx, height: iconPx }}
        >
          {baseIcon}
        </div>
        {isRenaming ? (
          <div style={{ width: trackPx - 8 }}>
            <FileManagerRenameInput
              node={node}
              validateRename={validateRename}
              onCommit={(next) => onRenameCommit(node.id, next)}
              onCancel={onRenameCancel}
            />
          </div>
        ) : (
          <span
            className="line-clamp-2 max-w-full text-center text-xs"
            title={node.name}
            style={{ maxWidth: trackPx - 4 }}
          >
            {node.name}
          </span>
        )}
      </div>
    );
  }

  // List mode
  return (
    <div
      {...sharedProps}
      style={outerStyle}
      className={cn(
        "group flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 text-sm outline-none transition-colors",
        selected
          ? "bg-secondary text-secondary-foreground"
          : "hover:bg-muted/60",
        focused &&
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isDropTarget &&
          !dropInvalid &&
          "ring-2 ring-primary",
        isDropTarget && dropInvalid && "ring-2 ring-destructive",
        cut && "opacity-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center opacity-80 transition-opacity group-hover:opacity-100",
          (selected || focused) && "opacity-100",
          isFolder
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground",
          selected && "text-secondary-foreground",
        )}
      >
        {baseIcon}
      </span>
      <span className="min-w-0 flex-1 truncate" title={node.name}>
        {isRenaming ? (
          <FileManagerRenameInput
            node={node}
            validateRename={validateRename}
            onCommit={(next) => onRenameCommit(node.id, next)}
            onCancel={onRenameCancel}
          />
        ) : (
          node.name
        )}
      </span>
      <span className="hidden w-32 shrink-0 text-xs text-muted-foreground sm:block">
        {formatDate(node.modifiedAt)}
      </span>
      <span className="hidden w-20 shrink-0 text-right font-mono text-xs text-muted-foreground sm:block">
        {isFolder ? "—" : formatBytes(node.size ?? 0)}
      </span>
      <span className="hidden w-16 shrink-0 text-xs text-muted-foreground md:block">
        {formatKind(ext, node.type)}
      </span>
    </div>
  );
}

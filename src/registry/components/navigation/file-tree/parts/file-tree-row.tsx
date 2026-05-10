"use client";

import type { CSSProperties, MouseEvent, ReactNode, KeyboardEvent } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FileTreeDropPosition,
  FileTreeLabels,
  FileTreeRow,
  FileTreeValidateRenameArgs,
  FsNode,
} from "../types";
import { defaultFileIcon, defaultFolderIcon } from "../lib/icons";
import { FileTreeRenameInput } from "./file-tree-rename-input";

interface FileTreeRowProps {
  row: FileTreeRow;
  indent: number;
  indentGuides: boolean;
  rowHeight: number;
  iconForNode?: (args: { node: FsNode }) => ReactNode;
  isRenaming: boolean;
  validateRename?: (args: FileTreeValidateRenameArgs) => string | null;
  enableInternalDrag: boolean;
  /** Drop-target visual state for this row — set only when this row is the current hover target. */
  dropPosition?: FileTreeDropPosition | null;
  dropInvalid?: boolean;
  /** Lazy-load error message for this folder — when set, an error sub-row replaces the children area. */
  loadError?: string;
  onRetryLoad?: () => void;
  labels: FileTreeLabels;
  // Callbacks from orchestrator
  onClick: (e: MouseEvent, row: FileTreeRow) => void;
  onChevronClick: (e: MouseEvent, row: FileTreeRow) => void;
  onDoubleClick: (e: MouseEvent, row: FileTreeRow) => void;
  onContextMenu: (e: MouseEvent, row: FileTreeRow) => void;
  onRenameCommit: (id: string, nextName: string) => void;
  onRenameCancel: () => void;
  onDragStart?: (e: React.DragEvent, row: FileTreeRow) => void;
  onDragOver?: (e: React.DragEvent, row: FileTreeRow) => void;
  onDragLeave?: (e: React.DragEvent, row: FileTreeRow) => void;
  onDrop?: (e: React.DragEvent, row: FileTreeRow) => void;
  onDragEnd?: (e: React.DragEvent, row: FileTreeRow) => void;
  onRowKeyDown?: (e: KeyboardEvent<HTMLDivElement>, row: FileTreeRow) => void;
  /** Used as `style` on the outer div; lets the row-list place rows absolutely in virtual mode. */
  outerStyle?: CSSProperties;
}

const MAX_INDENT_PX = 200;

export function FileTreeRowComponent(props: FileTreeRowProps) {
  const {
    row,
    indent,
    indentGuides,
    rowHeight,
    iconForNode,
    isRenaming,
    validateRename,
    enableInternalDrag,
    dropPosition,
    dropInvalid,
    loadError,
    onRetryLoad,
    labels,
    onClick,
    onChevronClick,
    onDoubleClick,
    onContextMenu,
    onRenameCommit,
    onRenameCancel,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onRowKeyDown,
    outerStyle,
  } = props;

  const { node, depth, expanded, selected, focused, hasChildren, loadingChildren } =
    row;
  const isFolder = node.type === "folder";

  const computedIndent = Math.min(depth * indent, MAX_INDENT_PX);
  const dropClass = dropInvalid ? "ring-2 ring-destructive" : "";
  const insideDrop = dropPosition === "inside";

  const icon = node.icon
    ? node.icon
    : iconForNode
      ? iconForNode({ node })
      : isFolder
        ? defaultFolderIcon(expanded)
        : defaultFileIcon(node);

  return (
    <div className="relative" style={outerStyle}>
      {/* before / after drop indicator (line) */}
      {dropPosition === "before" && !dropInvalid ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-0.5 bg-primary"
        />
      ) : null}
      {dropPosition === "after" && !dropInvalid ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-primary"
        />
      ) : null}

      <div
        role="treeitem"
        data-row-id={node.id}
        aria-level={depth + 1}
        aria-expanded={isFolder ? expanded : undefined}
        aria-selected={selected}
        aria-setsize={row.siblingCount}
        aria-posinset={row.siblingIndex}
        tabIndex={focused ? 0 : -1}
        draggable={enableInternalDrag && !isRenaming}
        onClick={(e) => onClick(e, row)}
        onDoubleClick={(e) => onDoubleClick(e, row)}
        onContextMenu={(e) => onContextMenu(e, row)}
        onDragStart={(e) =>
          enableInternalDrag && onDragStart && onDragStart(e, row)
        }
        onDragOver={(e) => onDragOver?.(e, row)}
        onDragLeave={(e) => onDragLeave?.(e, row)}
        onDrop={(e) => onDrop?.(e, row)}
        onDragEnd={(e) => onDragEnd?.(e, row)}
        onKeyDown={(e) => onRowKeyDown?.(e, row)}
        className={cn(
          "group relative flex cursor-pointer select-none items-center gap-1.5 px-2 text-sm",
          "rounded-sm",
          "outline-none transition-colors",
          selected
            ? "bg-secondary text-secondary-foreground"
            : "hover:bg-muted/60",
          focused && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          insideDrop && !dropInvalid && "ring-2 ring-primary",
          dropClass,
        )}
        style={{ height: `${rowHeight}px` }}
      >
        {/* indent guides */}
        {indentGuides
          ? Array.from({ length: depth }).map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="pointer-events-none absolute top-0 h-full w-px bg-border/50"
                style={{
                  left: `${Math.min((i + 1) * indent, MAX_INDENT_PX) - 1}px`,
                }}
              />
            ))
          : null}

        {/* indent spacer */}
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{ width: `${computedIndent}px` }}
        />

        {/* chevron OR spacer */}
        {isFolder && hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              onChevronClick(e, row);
            }}
            className="flex size-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {loadingChildren ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  "size-3.5 transition-transform",
                  expanded && "rotate-90",
                )}
              />
            )}
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="size-4 shrink-0"
          />
        )}

        {/* icon */}
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0",
            isFolder
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
            selected && "text-secondary-foreground",
          )}
        >
          {icon}
        </span>

        {/* label OR rename input */}
        {isRenaming ? (
          <FileTreeRenameInput
            node={node}
            validateRename={validateRename}
            onCommit={(next) => onRenameCommit(node.id, next)}
            onCancel={onRenameCancel}
          />
        ) : (
          <span
            className="min-w-0 flex-1 truncate"
            title={node.name}
          >
            {node.name}
          </span>
        )}
      </div>

      {/* lazy-load error sub-row */}
      {loadError ? (
        <div
          role="alert"
          className="flex items-center gap-2 px-2 py-1 text-xs text-destructive"
          style={{
            paddingLeft: `${Math.min((depth + 1) * indent + 8, MAX_INDENT_PX) + 8}px`,
          }}
        >
          <span>{labels.loadError}: {loadError}</span>
          {onRetryLoad ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetryLoad();
              }}
              className="rounded-sm border border-destructive px-1.5 py-0.5 text-xs hover:bg-destructive/10"
            >
              {labels.retry}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* (empty) placeholder for known-empty folders that are expanded */}
      {isFolder &&
      expanded &&
      node.children !== undefined &&
      node.children.length === 0 &&
      !loadError ? (
        <div
          aria-hidden="true"
          className="px-2 py-1 text-xs italic text-muted-foreground"
          style={{
            paddingLeft: `${Math.min((depth + 1) * indent + 8, MAX_INDENT_PX) + 16}px`,
          }}
        >
          (empty)
        </div>
      ) : null}
    </div>
  );
}

FileTreeRowComponent.displayName = "FileTreeRow";

export { FileTreeRowComponent as FileTreeRowView };

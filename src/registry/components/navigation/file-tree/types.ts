import type { CSSProperties, ReactNode, Ref } from "react";

export type FsNodeType = "file" | "folder";

/**
 * Hierarchical-node shape consumed by `<FileTree>`.
 *
 * `children` semantics:
 *  - `undefined` — unknown / not yet loaded → triggers `onLoadChildren` on first expand
 *  - `[]`        — known-empty folder → renders "(empty)" inline placeholder
 *  - `FsNode[]`  — pre-loaded children
 */
export interface FsNode {
  id: string;
  name: string;
  type: FsNodeType;
  parentId?: string | null;
  children?: FsNode[];
  ext?: string;
  size?: number;
  modifiedAt?: string;
  icon?: ReactNode;
  meta?: Record<string, unknown>;
}

export type FileTreeSelectionMode = "single" | "multi";
export type FileTreeDropPosition = "before" | "inside" | "after";
export type FileTreeVirtualizeMode = "auto" | "always" | "never";

/** Visible-row descriptor produced by the flattening pass. */
export interface FileTreeRow {
  node: FsNode;
  depth: number;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  hasChildren: boolean;
  childrenLoaded: boolean;
  loadingChildren: boolean;
  /** Position within the visible-rows array. */
  index: number;
  /** Number of visible siblings at this depth (for aria-setsize). */
  siblingCount: number;
  /** 1-based position among siblings at this depth (for aria-posinset). */
  siblingIndex: number;
}

/** Read-only state surfaced to slots and the imperative ref. */
export interface FileTreeState {
  expandedIds: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
  renamingId: string | null;
  loadingFolderIds: ReadonlySet<string>;
}

/** Imperative actions exposed to slots and the imperative ref. */
export interface FileTreeActions {
  expand: (id: string) => void;
  collapse: (id: string) => void;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  select: (idOrIds: string | string[]) => void;
  clearSelection: () => void;
  focusNode: (id: string) => void;
  startRename: (id: string) => void;
  cancelRename: () => void;
  triggerCreate: (parentId: string | null, type: FsNodeType) => void;
  triggerDelete: (ids: string[]) => void;
  refresh: (nodeId?: string | null) => void;
}

export interface FileTreeHandle {
  state: FileTreeState;
  actions: FileTreeActions;
}

// ─── Callback arg shapes (object-shape per F-cross-12) ──────────────────────

export interface FileTreeOpenArgs {
  node: FsNode;
}
export interface FileTreeCreateArgs {
  parentId: string | null;
  type: FsNodeType;
}
export interface FileTreeRenameArgs {
  id: string;
  node: FsNode;
  nextName: string;
}
export interface FileTreeDeleteArgs {
  ids: string[];
}
export interface FileTreeMoveArgs {
  ids: string[];
  targetId: string | null;
  position: FileTreeDropPosition;
}
export interface FileTreeRefreshArgs {
  nodeId: string | null;
}
export interface FileTreeExternalDropArgs {
  files: File[];
  targetId: string | null;
}
export interface FileTreeLoadChildrenArgs {
  nodeId: string;
  node: FsNode;
}
export interface FileTreeSelectionChangeArgs {
  ids: Set<string>;
}
export interface FileTreeExpandedChangeArgs {
  ids: Set<string>;
}
export interface FileTreeValidateRenameArgs {
  node: FsNode;
  nextName: string;
}
export interface FileTreeIconForNodeArgs {
  node: FsNode;
}

// ─── Default labels (full set; consumers override partially via `labels` prop) ─

export interface FileTreeLabels {
  title: string;
  newFile: string;
  newFolder: string;
  refresh: string;
  collapseAll: string;
  contextOpen: string;
  contextNewFile: string;
  contextNewFolder: string;
  contextRename: string;
  contextDelete: string;
  contextRefresh: string;
  deleteConfirmTitle: string;
  deleteConfirmDescription: string;
  deleteConfirmAction: string;
  deleteConfirmCancel: string;
  emptyTitle: string;
  loading: string;
  externalDropOverlay: string;
  nodeCount: string;
  loadError: string;
  retry: string;
}

// ─── Slot contexts ──────────────────────────────────────────────────────────

export interface FileTreeHeaderContext {
  state: FileTreeState;
  actions: FileTreeActions;
  totalCount: number;
  visibleCount: number;
  showNewFile: boolean;
  showNewFolder: boolean;
  showRefresh: boolean;
  showCollapseAll: boolean;
  title?: string;
  labels: FileTreeLabels;
}

export type FileTreeContextMenuItemId =
  | "open"
  | "new-file"
  | "new-folder"
  | "rename"
  | "delete"
  | "refresh";

export interface FileTreeContextMenuItem {
  id: FileTreeContextMenuItemId;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}

export interface FileTreeContextMenuContext {
  state: FileTreeState;
  actions: FileTreeActions;
  /** The node under the right-click target. `null` when right-clicking empty whitespace. */
  node: FsNode | null;
  defaultActions: FileTreeContextMenuItem[];
  position: { x: number; y: number };
  labels: FileTreeLabels;
}

export interface FileTreeEmptyContext {
  actions: FileTreeActions;
  showNewFile: boolean;
  showNewFolder: boolean;
  labels: FileTreeLabels;
}

export interface FileTreeRowRenderArgs {
  row: FileTreeRow;
  defaultRow: ReactNode;
}

export interface FileTreeDeleteConfirmContext {
  ids: string[];
  nodes: FsNode[];
  onConfirm: () => void;
  onCancel: () => void;
  labels: FileTreeLabels;
}

// ─── Top-level props ────────────────────────────────────────────────────────

export interface FileTreeProps {
  // Data
  nodes: FsNode[];
  loading?: boolean;

  // Selection
  selectionMode?: FileTreeSelectionMode;
  selectedIds?: Set<string>;
  defaultSelectedIds?: Set<string>;
  onSelectedChange?: (args: FileTreeSelectionChangeArgs) => void;

  // Expansion
  expandedIds?: Set<string>;
  defaultExpandedIds?: Set<string>;
  onExpandedChange?: (args: FileTreeExpandedChangeArgs) => void;

  // Lazy loading
  onLoadChildren?: (args: FileTreeLoadChildrenArgs) => Promise<FsNode[]>;

  // Operations
  onOpen?: (args: FileTreeOpenArgs) => void;
  onCreate?: (args: FileTreeCreateArgs) => void;
  onRename?: (args: FileTreeRenameArgs) => void;
  onDelete?: (args: FileTreeDeleteArgs) => void;
  onMove?: (args: FileTreeMoveArgs) => void;
  onRefresh?: (args: FileTreeRefreshArgs) => void;
  onExternalDrop?: (args: FileTreeExternalDropArgs) => void;
  validateRename?: (args: FileTreeValidateRenameArgs) => string | null;

  // Rendering
  iconForNode?: (args: FileTreeIconForNodeArgs) => ReactNode;
  renderRow?: (args: FileTreeRowRenderArgs) => ReactNode;
  renderHeader?: (ctx: FileTreeHeaderContext) => ReactNode;
  renderContextMenu?: (ctx: FileTreeContextMenuContext) => ReactNode;
  renderEmpty?: (ctx: FileTreeEmptyContext) => ReactNode;
  renderLoading?: () => ReactNode;
  renderDeleteConfirm?: (ctx: FileTreeDeleteConfirmContext) => ReactNode;

  // Header config
  header?: boolean;
  title?: string;
  showNewFile?: boolean;
  showNewFolder?: boolean;
  showRefresh?: boolean;
  showCollapseAll?: boolean;

  // Context-menu config
  contextMenu?: boolean;
  contextMenuActions?: {
    open?: boolean;
    newFile?: boolean;
    newFolder?: boolean;
    rename?: boolean;
    delete?: boolean;
    refresh?: boolean;
  };

  // Behavior
  showHidden?: boolean;
  isHidden?: (node: FsNode) => boolean;
  sortNodes?: ((a: FsNode, b: FsNode) => number) | false;
  indentGuides?: boolean;
  rowHeight?: number;
  indent?: number;

  // Confirmation
  confirmDelete?: boolean;

  // DnD
  enableInternalDrag?: boolean;
  enableExternalDrop?: boolean;

  // Virtualization
  virtualize?: FileTreeVirtualizeMode;
  virtualizeThreshold?: number;

  // Polymorphic
  className?: string;
  style?: CSSProperties;

  // Imperative handle
  ref?: Ref<FileTreeHandle>;

  // i18n labels
  labels?: Partial<FileTreeLabels>;
}

/** Default labels — exported so consumers can build complete label objects. */
export const DEFAULT_FILE_TREE_LABELS: FileTreeLabels = {
  title: "Files",
  newFile: "New File",
  newFolder: "New Folder",
  refresh: "Refresh",
  collapseAll: "Collapse All",
  contextOpen: "Open",
  contextNewFile: "New File",
  contextNewFolder: "New Folder",
  contextRename: "Rename",
  contextDelete: "Delete",
  contextRefresh: "Refresh",
  deleteConfirmTitle: "Delete items?",
  deleteConfirmDescription: "This action cannot be undone.",
  deleteConfirmAction: "Delete",
  deleteConfirmCancel: "Cancel",
  emptyTitle: "No items",
  loading: "Loading…",
  externalDropOverlay: "Drop files here",
  nodeCount: "items",
  loadError: "Failed to load",
  retry: "Retry",
};

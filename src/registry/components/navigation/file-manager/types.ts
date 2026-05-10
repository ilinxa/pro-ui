import type { CSSProperties, ReactNode, Ref } from "react";

import type {
  FileClipboard,
  FileClipboardKind,
} from "../_shared/file-clipboard";

export type { FileClipboard, FileClipboardKind };

export type FsNodeType = "file" | "folder";

/** Hierarchical-node shape — compatible-by-convention with file-tree's FsNode. */
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

export type FileManagerViewMode = "grid" | "list";
export type FileManagerIconSize = "sm" | "md" | "lg";
export type FileManagerSortKey = "name" | "modified" | "size" | "type";
export type FileManagerSortOrder = "asc" | "desc";
export type FileManagerDropPosition = "inside";
export type FileManagerVirtualizeMode = "auto" | "always" | "never";

export interface FileManagerSortState {
  key: FileManagerSortKey;
  order: FileManagerSortOrder;
}

/** Visible-item descriptor produced for each visible cell/row. */
export interface FileManagerItem {
  node: FsNode;
  selected: boolean;
  focused: boolean;
  cut: boolean;
  index: number;
  totalVisible: number;
}

/** Read-only state surfaced to slots and the imperative ref. */
export interface FileManagerState {
  currentFolderId: string | null;
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
  renamingId: string | null;
  viewMode: FileManagerViewMode;
  iconSize: FileManagerIconSize;
  sort: FileManagerSortState;
  searchQuery: string;
  /** Path from root to the current folder (root → ... → current). Empty when at root. */
  path: FsNode[];
  loadingChildren: boolean;
  loadError: string | null;
  clipboard: FileClipboard;
  historyBackIds: string[];
  historyForwardIds: string[];
}

/** Imperative actions exposed to slots and the imperative ref. */
export interface FileManagerActions {
  navigateTo: (folderId: string | null) => void;
  navigateUp: () => void;
  navigateBack: () => void;
  navigateForward: () => void;
  refresh: (nodeId?: string | null) => void;

  setViewMode: (mode: FileManagerViewMode) => void;
  setIconSize: (size: FileManagerIconSize) => void;
  setSort: (sort: FileManagerSortState) => void;
  setSearchQuery: (query: string) => void;

  select: (idOrIds: string | string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  focusNode: (id: string) => void;

  startRename: (id: string) => void;
  cancelRename: () => void;

  triggerCreate: (type: FsNodeType) => void;
  triggerDelete: (ids: string[]) => void;
  triggerOpen: (id: string) => void;

  cut: (ids: string[]) => void;
  copy: (ids: string[]) => void;
  paste: () => void;
  clearClipboard: () => void;
}

export interface FileManagerHandle {
  state: FileManagerState;
  actions: FileManagerActions;
}

// ─── Callback arg shapes (object-shape per F-cross-12) ─────────────────────

export interface FileManagerOpenArgs {
  node: FsNode;
}
export interface FileManagerCurrentFolderChangeArgs {
  folderId: string | null;
}
export interface FileManagerCreateArgs {
  parentId: string | null;
  type: FsNodeType;
}
export interface FileManagerRenameArgs {
  id: string;
  node: FsNode;
  nextName: string;
}
export interface FileManagerDeleteArgs {
  ids: string[];
}
export interface FileManagerMoveArgs {
  ids: string[];
  targetId: string | null;
  position: FileManagerDropPosition;
}
export interface FileManagerPasteArgs {
  ids: string[];
  kind: FileClipboardKind;
  targetFolderId: string | null;
}
export interface FileManagerClipboardChangeArgs {
  clipboard: FileClipboard;
}
export interface FileManagerRefreshArgs {
  nodeId: string | null;
}
export interface FileManagerExternalDropArgs {
  files: File[];
  targetFolderId: string | null;
}
export interface FileManagerLoadChildrenArgs {
  nodeId: string;
  node: FsNode;
}
export interface FileManagerSelectionChangeArgs {
  ids: Set<string>;
}
export interface FileManagerSortChangeArgs {
  sort: FileManagerSortState;
}
export interface FileManagerViewModeChangeArgs {
  mode: FileManagerViewMode;
}
export interface FileManagerIconSizeChangeArgs {
  size: FileManagerIconSize;
}
export interface FileManagerSearchChangeArgs {
  query: string;
}
export interface FileManagerPathTypedArgs {
  path: string;
}
export interface FileManagerValidateRenameArgs {
  node: FsNode;
  nextName: string;
}
export interface FileManagerIconForNodeArgs {
  node: FsNode;
}

// ─── Default labels ─────────────────────────────────────────────────────────

export interface FileManagerLabels {
  title: string;
  back: string;
  forward: string;
  up: string;
  refresh: string;
  newFile: string;
  newFolder: string;
  searchPlaceholder: string;
  viewGrid: string;
  viewList: string;
  iconSizeSmall: string;
  iconSizeMedium: string;
  iconSizeLarge: string;
  sortByName: string;
  sortByModified: string;
  sortBySize: string;
  sortByType: string;
  sortAsc: string;
  sortDesc: string;
  contextOpen: string;
  contextNewFile: string;
  contextNewFolder: string;
  contextCut: string;
  contextCopy: string;
  contextPaste: string;
  contextRename: string;
  contextDelete: string;
  contextRefresh: string;
  deleteConfirmTitle: string;
  deleteConfirmDescription: string;
  deleteConfirmAction: string;
  deleteConfirmCancel: string;
  emptyTitle: string;
  loading: string;
  loadError: string;
  retry: string;
  externalDropOverlay: string;
  itemCount: string;
  itemCountSelected: string;
  totalSize: string;
  pathRoot: string;
  columnName: string;
  columnModified: string;
  columnSize: string;
  columnType: string;
}

// ─── Slot contexts ──────────────────────────────────────────────────────────

export interface FileManagerToolbarContext {
  state: FileManagerState;
  actions: FileManagerActions;
  showNewFile: boolean;
  showNewFolder: boolean;
  showRefresh: boolean;
  showSearch: boolean;
  showViewToggle: boolean;
  showIconSize: boolean;
  showSort: boolean;
  showBackForward: boolean;
  showUpButton: boolean;
  showPathBar: boolean;
  title?: string;
  labels: FileManagerLabels;
}

export interface FileManagerStatusBarContext {
  state: FileManagerState;
  actions: FileManagerActions;
  totalCount: number;
  selectedCount: number;
  totalSize: number;
  labels: FileManagerLabels;
}

export type FileManagerContextMenuItemId =
  | "open"
  | "new-file"
  | "new-folder"
  | "cut"
  | "copy"
  | "paste"
  | "rename"
  | "delete"
  | "refresh";

export interface FileManagerContextMenuItem {
  id: FileManagerContextMenuItemId;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}

export interface FileManagerContextMenuContext {
  state: FileManagerState;
  actions: FileManagerActions;
  /** Right-clicked item — `null` when right-clicking empty whitespace. */
  node: FsNode | null;
  defaultActions: FileManagerContextMenuItem[];
  position: { x: number; y: number };
  labels: FileManagerLabels;
}

export interface FileManagerEmptyContext {
  actions: FileManagerActions;
  showNewFile: boolean;
  showNewFolder: boolean;
  labels: FileManagerLabels;
}

export interface FileManagerItemRenderArgs {
  item: FileManagerItem;
  defaultItem: ReactNode;
  viewMode: FileManagerViewMode;
}

export interface FileManagerDeleteConfirmContext {
  ids: string[];
  nodes: FsNode[];
  onConfirm: () => void;
  onCancel: () => void;
  labels: FileManagerLabels;
}

// ─── Top-level props ────────────────────────────────────────────────────────

export interface FileManagerProps {
  // Data
  nodes: FsNode[];

  // Current folder
  currentFolderId?: string | null;
  defaultCurrentFolderId?: string | null;
  onCurrentFolderChange?: (
    args: FileManagerCurrentFolderChangeArgs,
  ) => void;

  // Lazy load
  onLoadChildren?: (
    args: FileManagerLoadChildrenArgs,
  ) => Promise<FsNode[]>;

  // Selection
  selectedIds?: Set<string>;
  defaultSelectedIds?: Set<string>;
  onSelectedChange?: (args: FileManagerSelectionChangeArgs) => void;
  preserveSelectionOnNavigate?: boolean;

  // Clipboard
  clipboard?: FileClipboard;
  defaultClipboard?: FileClipboard;
  onClipboardChange?: (args: FileManagerClipboardChangeArgs) => void;

  // Operations
  onOpen?: (args: FileManagerOpenArgs) => void;
  onCreate?: (args: FileManagerCreateArgs) => void;
  onRename?: (args: FileManagerRenameArgs) => void;
  onDelete?: (args: FileManagerDeleteArgs) => void;
  onMove?: (args: FileManagerMoveArgs) => void;
  onPaste?: (args: FileManagerPasteArgs) => void;
  onRefresh?: (args: FileManagerRefreshArgs) => void;
  onExternalDrop?: (args: FileManagerExternalDropArgs) => void;
  validateRename?: (args: FileManagerValidateRenameArgs) => string | null;

  // View mode
  viewMode?: FileManagerViewMode;
  defaultViewMode?: FileManagerViewMode;
  onViewModeChange?: (args: FileManagerViewModeChangeArgs) => void;

  // Icon size
  iconSize?: FileManagerIconSize;
  defaultIconSize?: FileManagerIconSize;
  onIconSizeChange?: (args: FileManagerIconSizeChangeArgs) => void;

  // Sort
  sort?: FileManagerSortState;
  defaultSort?: FileManagerSortState;
  onSortChange?: (args: FileManagerSortChangeArgs) => void;
  sortItems?: (a: FsNode, b: FsNode, sort: FileManagerSortState) => number;

  // Search / filter
  searchQuery?: string;
  defaultSearchQuery?: string;
  onSearchQueryChange?: (args: FileManagerSearchChangeArgs) => void;
  filterItems?: (node: FsNode, query: string) => boolean;
  showHidden?: boolean;
  isHidden?: (node: FsNode) => boolean;

  // Navigation history
  enableHistory?: boolean;
  historyBackIds?: string[];
  historyForwardIds?: string[];
  onPathTyped?: (args: FileManagerPathTypedArgs) => void;

  // Rendering
  iconForNode?: (args: FileManagerIconForNodeArgs) => ReactNode;
  renderItem?: (args: FileManagerItemRenderArgs) => ReactNode;
  renderToolbar?: (ctx: FileManagerToolbarContext) => ReactNode;
  renderContextMenu?: (ctx: FileManagerContextMenuContext) => ReactNode;
  renderEmpty?: (ctx: FileManagerEmptyContext) => ReactNode;
  renderLoading?: () => ReactNode;
  renderStatusBar?: (ctx: FileManagerStatusBarContext) => ReactNode;
  renderDeleteConfirm?: (ctx: FileManagerDeleteConfirmContext) => ReactNode;

  // Slots
  sidebar?: ReactNode;
  details?: ReactNode;

  // Toolbar config
  toolbar?: boolean;
  title?: string;
  showNewFile?: boolean;
  showNewFolder?: boolean;
  showRefresh?: boolean;
  showSearch?: boolean;
  showViewToggle?: boolean;
  showIconSize?: boolean;
  showSort?: boolean;
  showBackForward?: boolean;
  showUpButton?: boolean;
  showPathBar?: boolean;

  // Status bar
  showStatusBar?: boolean;

  // Context-menu config
  contextMenu?: boolean;
  contextMenuActions?: {
    open?: boolean;
    newFile?: boolean;
    newFolder?: boolean;
    cut?: boolean;
    copy?: boolean;
    paste?: boolean;
    rename?: boolean;
    delete?: boolean;
    refresh?: boolean;
  };

  // Confirmation
  confirmDelete?: boolean;

  // DnD
  enableInternalDrag?: boolean;
  enableExternalDrop?: boolean;
  enableMarqueeSelection?: boolean;

  // Virtualization (list view only at v0.1.0)
  virtualize?: FileManagerVirtualizeMode;
  virtualizeThreshold?: number;

  // Polymorphic
  className?: string;
  style?: CSSProperties;

  // Imperative handle
  ref?: Ref<FileManagerHandle>;

  // i18n labels
  labels?: Partial<FileManagerLabels>;
}

export const DEFAULT_FILE_MANAGER_LABELS: FileManagerLabels = {
  title: "Files",
  back: "Back",
  forward: "Forward",
  up: "Up",
  refresh: "Refresh",
  newFile: "New File",
  newFolder: "New Folder",
  searchPlaceholder: "Search...",
  viewGrid: "Grid view",
  viewList: "List view",
  iconSizeSmall: "Small icons",
  iconSizeMedium: "Medium icons",
  iconSizeLarge: "Large icons",
  sortByName: "Name",
  sortByModified: "Date Modified",
  sortBySize: "Size",
  sortByType: "Type",
  sortAsc: "Ascending",
  sortDesc: "Descending",
  contextOpen: "Open",
  contextNewFile: "New File",
  contextNewFolder: "New Folder",
  contextCut: "Cut",
  contextCopy: "Copy",
  contextPaste: "Paste",
  contextRename: "Rename",
  contextDelete: "Delete",
  contextRefresh: "Refresh",
  deleteConfirmTitle: "Delete items?",
  deleteConfirmDescription: "This action cannot be undone.",
  deleteConfirmAction: "Delete",
  deleteConfirmCancel: "Cancel",
  emptyTitle: "This folder is empty",
  loading: "Loading…",
  loadError: "Failed to load",
  retry: "Retry",
  externalDropOverlay: "Drop files here",
  itemCount: "items",
  itemCountSelected: "selected",
  totalSize: "total",
  pathRoot: "Files",
  columnName: "Name",
  columnModified: "Modified",
  columnSize: "Size",
  columnType: "Type",
};

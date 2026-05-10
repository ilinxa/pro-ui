export { FileManager } from "./file-manager";
export { FileManagerToolbar } from "./parts/file-manager-toolbar";
export { FileManagerPathBar } from "./parts/file-manager-path-bar";
export { FileManagerViewToggle } from "./parts/file-manager-view-toggle";
export { FileManagerIconSizeControl } from "./parts/file-manager-icon-size-control";
export { FileManagerSortMenu } from "./parts/file-manager-sort-menu";
export { FileManagerSearchInput } from "./parts/file-manager-search-input";
export { FileManagerStatusBar } from "./parts/file-manager-status-bar";
export { FileManagerBackForward } from "./parts/file-manager-back-forward";
export { FileManagerUpButton } from "./parts/file-manager-up-button";
export { FileManagerNewButtons } from "./parts/file-manager-new-buttons";
export { FileManagerRefreshButton } from "./parts/file-manager-refresh-button";
export { useFileManager } from "./hooks/use-file-manager-context";
export { mergeLoadedChildren } from "./lib/tree-utils";
export { iconForExtension } from "./lib/icons";
export { DEFAULT_FILE_MANAGER_LABELS } from "./types";

// Shared clipboard primitive (sibling _shared/ module). Re-exported for
// convenience so consumers don't need to import from a non-component path.
export {
  FileClipboardProvider,
  useFileClipboard,
  EMPTY_CLIPBOARD,
} from "../_shared/file-clipboard";

export type {
  FsNode,
  FsNodeType,
  FileManagerProps,
  FileManagerHandle,
  FileManagerState,
  FileManagerActions,
  FileManagerItem,
  FileManagerViewMode,
  FileManagerIconSize,
  FileManagerSortKey,
  FileManagerSortOrder,
  FileManagerSortState,
  FileManagerDropPosition,
  FileManagerVirtualizeMode,
  FileClipboard,
  FileClipboardKind,
  FileManagerOpenArgs,
  FileManagerCurrentFolderChangeArgs,
  FileManagerCreateArgs,
  FileManagerRenameArgs,
  FileManagerDeleteArgs,
  FileManagerMoveArgs,
  FileManagerPasteArgs,
  FileManagerClipboardChangeArgs,
  FileManagerRefreshArgs,
  FileManagerExternalDropArgs,
  FileManagerLoadChildrenArgs,
  FileManagerSelectionChangeArgs,
  FileManagerSortChangeArgs,
  FileManagerViewModeChangeArgs,
  FileManagerIconSizeChangeArgs,
  FileManagerSearchChangeArgs,
  FileManagerPathTypedArgs,
  FileManagerValidateRenameArgs,
  FileManagerIconForNodeArgs,
  FileManagerContextMenuItem,
  FileManagerContextMenuItemId,
  FileManagerToolbarContext,
  FileManagerStatusBarContext,
  FileManagerContextMenuContext,
  FileManagerEmptyContext,
  FileManagerItemRenderArgs,
  FileManagerDeleteConfirmContext,
  FileManagerLabels,
} from "./types";

"use client";

import type { FileManagerPathTypedArgs } from "../types";
import { useFileManager } from "../hooks/use-file-manager-context";
import { FileManagerBackForward } from "./file-manager-back-forward";
import { FileManagerUpButton } from "./file-manager-up-button";
import { FileManagerPathBar } from "./file-manager-path-bar";
import { FileManagerViewToggle } from "./file-manager-view-toggle";
import { FileManagerIconSizeControl } from "./file-manager-icon-size-control";
import { FileManagerSortMenu } from "./file-manager-sort-menu";
import { FileManagerSearchInput } from "./file-manager-search-input";
import { FileManagerNewButtons } from "./file-manager-new-buttons";
import { FileManagerRefreshButton } from "./file-manager-refresh-button";

export interface FileManagerToolbarProps {
  onPathTyped?: (args: FileManagerPathTypedArgs) => void;
}

export function FileManagerToolbar(props: FileManagerToolbarProps) {
  const { onPathTyped } = props;
  const {
    showBackForward,
    showUpButton,
    showPathBar,
    showSearch,
    showSort,
    showIconSize,
    showViewToggle,
    showNewFile,
    showNewFolder,
    showRefresh,
  } = useFileManager();

  return (
    <div
      role="toolbar"
      className="flex h-10 shrink-0 items-center gap-1 border-b border-border/60 bg-card/40 px-2"
    >
      {showBackForward ? <FileManagerBackForward /> : null}
      {showUpButton ? <FileManagerUpButton /> : null}
      {showPathBar ? <FileManagerPathBar onPathTyped={onPathTyped} /> : null}
      {showSearch ? <FileManagerSearchInput /> : null}
      {showSort ? <FileManagerSortMenu /> : null}
      {showIconSize ? <FileManagerIconSizeControl /> : null}
      {showViewToggle ? <FileManagerViewToggle /> : null}
      {(showNewFile || showNewFolder) ? <FileManagerNewButtons /> : null}
      {showRefresh ? <FileManagerRefreshButton /> : null}
    </div>
  );
}

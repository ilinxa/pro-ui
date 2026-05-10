"use client";

import { createContext, useContext } from "react";
import type {
  FileManagerActions,
  FileManagerItem,
  FileManagerLabels,
  FileManagerState,
} from "../types";

export interface FileManagerContextValue {
  state: FileManagerState;
  actions: FileManagerActions;
  /** Visible items in the current folder, post-sort + filter + hidden. */
  items: FileManagerItem[];
  /** Total node count across the entire `nodes` tree (recursive). */
  totalCount: number;
  /** Visible-item count in the current folder. */
  visibleCount: number;
  /** Sum of `size` over visible items (folders contribute 0). */
  totalSize: number;
  /** Header config flags (read by toolbar atoms). */
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
  showStatusBar: boolean;
  title?: string;
  labels: FileManagerLabels;
}

export const FileManagerContext =
  createContext<FileManagerContextValue | null>(null);

/**
 * Public consumer hook for advanced custom-chrome composition. Used by the
 * standalone toolbar atoms internally and exposed to consumers writing a
 * `renderToolbar` slot.
 *
 * Throws if called outside `<FileManager>`.
 */
export function useFileManager(): FileManagerContextValue {
  const ctx = useContext(FileManagerContext);
  if (!ctx) {
    throw new Error(
      "useFileManager() must be called inside <FileManager>",
    );
  }
  return ctx;
}

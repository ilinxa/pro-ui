"use client";

import { createContext, useContext } from "react";
import type {
  FileTreeActions,
  FileTreeLabels,
  FileTreeRow,
  FileTreeState,
} from "../types";

export interface FileTreeContextValue {
  state: FileTreeState;
  actions: FileTreeActions;
  rows: FileTreeRow[];
  totalCount: number;
  visibleCount: number;
  /** Header config (read by standalone parts). */
  showNewFile: boolean;
  showNewFolder: boolean;
  showRefresh: boolean;
  showCollapseAll: boolean;
  title?: string;
  labels: FileTreeLabels;
}

export const FileTreeContext = createContext<FileTreeContextValue | null>(null);

/**
 * Public consumer hook. Exposes state, actions, and header-config for
 * consumers building a custom header inside `renderHeader` or composing
 * standalone parts.
 *
 * Throws if called outside `<FileTree>`.
 */
export function useFileTree(): FileTreeContextValue {
  const ctx = useContext(FileTreeContext);
  if (!ctx) {
    throw new Error("useFileTree() must be called inside <FileTree>");
  }
  return ctx;
}

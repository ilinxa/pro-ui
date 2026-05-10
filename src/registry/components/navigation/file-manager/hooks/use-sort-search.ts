"use client";

import { useCallback, useState } from "react";
import type {
  FileManagerIconSize,
  FileManagerIconSizeChangeArgs,
  FileManagerSearchChangeArgs,
  FileManagerSortChangeArgs,
  FileManagerSortState,
  FileManagerViewMode,
  FileManagerViewModeChangeArgs,
} from "../types";

interface UseSortSearchArgs {
  controlledSort?: FileManagerSortState;
  defaultSort?: FileManagerSortState;
  onSortChange?: (args: FileManagerSortChangeArgs) => void;

  controlledSearch?: string;
  defaultSearch?: string;
  onSearchChange?: (args: FileManagerSearchChangeArgs) => void;

  controlledViewMode?: FileManagerViewMode;
  defaultViewMode?: FileManagerViewMode;
  onViewModeChange?: (args: FileManagerViewModeChangeArgs) => void;

  controlledIconSize?: FileManagerIconSize;
  defaultIconSize?: FileManagerIconSize;
  onIconSizeChange?: (args: FileManagerIconSizeChangeArgs) => void;
}

const DEFAULT_SORT: FileManagerSortState = { key: "name", order: "asc" };

export interface UseSortSearchResult {
  sort: FileManagerSortState;
  searchQuery: string;
  viewMode: FileManagerViewMode;
  iconSize: FileManagerIconSize;
  setSort: (next: FileManagerSortState) => void;
  setSearchQuery: (next: string) => void;
  setViewMode: (next: FileManagerViewMode) => void;
  setIconSize: (next: FileManagerIconSize) => void;
}

export function useSortSearch(args: UseSortSearchArgs): UseSortSearchResult {
  const {
    controlledSort,
    defaultSort,
    onSortChange,
    controlledSearch,
    defaultSearch,
    onSearchChange,
    controlledViewMode,
    defaultViewMode,
    onViewModeChange,
    controlledIconSize,
    defaultIconSize,
    onIconSizeChange,
  } = args;

  const [internalSort, setInternalSort] = useState<FileManagerSortState>(
    defaultSort ?? DEFAULT_SORT,
  );
  const [internalSearch, setInternalSearch] = useState<string>(
    defaultSearch ?? "",
  );
  const [internalViewMode, setInternalViewMode] = useState<FileManagerViewMode>(
    defaultViewMode ?? "grid",
  );
  const [internalIconSize, setInternalIconSize] = useState<FileManagerIconSize>(
    defaultIconSize ?? "md",
  );

  const sort = controlledSort ?? internalSort;
  const searchQuery = controlledSearch ?? internalSearch;
  const viewMode = controlledViewMode ?? internalViewMode;
  const iconSize = controlledIconSize ?? internalIconSize;

  const setSort = useCallback(
    (next: FileManagerSortState) => {
      if (controlledSort === undefined) setInternalSort(next);
      onSortChange?.({ sort: next });
    },
    [controlledSort, onSortChange],
  );

  const setSearchQuery = useCallback(
    (next: string) => {
      if (controlledSearch === undefined) setInternalSearch(next);
      onSearchChange?.({ query: next });
    },
    [controlledSearch, onSearchChange],
  );

  const setViewMode = useCallback(
    (next: FileManagerViewMode) => {
      if (controlledViewMode === undefined) setInternalViewMode(next);
      onViewModeChange?.({ mode: next });
    },
    [controlledViewMode, onViewModeChange],
  );

  const setIconSize = useCallback(
    (next: FileManagerIconSize) => {
      if (controlledIconSize === undefined) setInternalIconSize(next);
      onIconSizeChange?.({ size: next });
    },
    [controlledIconSize, onIconSizeChange],
  );

  return {
    sort,
    searchQuery,
    viewMode,
    iconSize,
    setSort,
    setSearchQuery,
    setViewMode,
    setIconSize,
  };
}

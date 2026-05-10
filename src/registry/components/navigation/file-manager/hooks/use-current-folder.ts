"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  FileManagerCurrentFolderChangeArgs,
  FsNode,
} from "../types";
import { buildPath } from "../lib/path";
import { useNavigationHistory } from "./use-navigation-history";

interface UseCurrentFolderArgs {
  nodes: FsNode[];
  index: Map<string, FsNode>;
  controlledFolderId?: string | null;
  defaultFolderId?: string | null;
  onCurrentFolderChange?: (
    args: FileManagerCurrentFolderChangeArgs,
  ) => void;
  enableHistory: boolean;
  controlledBack?: string[];
  controlledForward?: string[];
}

export interface UseCurrentFolderResult {
  currentFolderId: string | null;
  path: FsNode[];
  navigateTo: (folderId: string | null) => void;
  navigateUp: () => void;
  navigateBack: () => void;
  navigateForward: () => void;
  historyBackIds: string[];
  historyForwardIds: string[];
}

export function useCurrentFolder(
  args: UseCurrentFolderArgs,
): UseCurrentFolderResult {
  const {
    index,
    controlledFolderId,
    defaultFolderId,
    onCurrentFolderChange,
    enableHistory,
    controlledBack,
    controlledForward,
  } = args;

  const [internalFolderId, setInternalFolderId] = useState<string | null>(
    defaultFolderId ?? null,
  );
  const currentFolderId =
    controlledFolderId !== undefined ? controlledFolderId : internalFolderId;

  const history = useNavigationHistory({
    enableHistory,
    controlledBack,
    controlledForward,
  });

  const path = useMemo(
    () => buildPath(currentFolderId, index),
    [currentFolderId, index],
  );

  const setFolder = useCallback(
    (next: string | null, pushToHistory: boolean) => {
      if (next === currentFolderId) return;
      if (pushToHistory) {
        history.pushVisit(currentFolderId);
      }
      if (controlledFolderId === undefined) setInternalFolderId(next);
      onCurrentFolderChange?.({ folderId: next });
    },
    [currentFolderId, controlledFolderId, onCurrentFolderChange, history],
  );

  const navigateTo = useCallback(
    (folderId: string | null) => {
      setFolder(folderId, true);
    },
    [setFolder],
  );

  const navigateUp = useCallback(() => {
    if (currentFolderId === null) return;
    const current = index.get(currentFolderId);
    const parentId = current?.parentId ?? null;
    setFolder(parentId, true);
  }, [currentFolderId, index, setFolder]);

  const navigateBack = useCallback(() => {
    const previous = history.popBack(currentFolderId);
    if (previous === undefined) return;
    if (controlledFolderId === undefined) setInternalFolderId(previous);
    onCurrentFolderChange?.({ folderId: previous });
  }, [history, currentFolderId, controlledFolderId, onCurrentFolderChange]);

  const navigateForward = useCallback(() => {
    const next = history.popForward(currentFolderId);
    if (next === undefined) return;
    if (controlledFolderId === undefined) setInternalFolderId(next);
    onCurrentFolderChange?.({ folderId: next });
  }, [history, currentFolderId, controlledFolderId, onCurrentFolderChange]);

  return {
    currentFolderId,
    path,
    navigateTo,
    navigateUp,
    navigateBack,
    navigateForward,
    historyBackIds: history.backIds,
    historyForwardIds: history.forwardIds,
  };
}

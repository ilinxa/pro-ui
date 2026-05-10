"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FileManagerLoadChildrenArgs, FsNode } from "../types";

interface UseLazyLoadArgs {
  nodes: FsNode[];
  currentFolderId: string | null;
  index: Map<string, FsNode>;
  onLoadChildren?: (
    args: FileManagerLoadChildrenArgs,
  ) => Promise<FsNode[]>;
}

export interface UseLazyLoadResult {
  loadingChildren: boolean;
  loadError: string | null;
  retry: () => void;
}

/**
 * Auto-fires `onLoadChildren` when the current folder's `children` is
 * `undefined`. Per-folder loading + error state is keyed by folder id so
 * navigating between folders surfaces the right state without a clear effect.
 */
export function useLazyLoad(args: UseLazyLoadArgs): UseLazyLoadResult {
  const { currentFolderId, index, onLoadChildren } = args;
  const [loadingIds, setLoadingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [errorById, setErrorById] = useState<Map<string, string>>(
    () => new Map(),
  );
  const inFlightRef = useRef<Set<string>>(new Set());

  const triggerLoad = useCallback(
    async (folderId: string) => {
      if (!onLoadChildren) return;
      if (inFlightRef.current.has(folderId)) return;
      const node = index.get(folderId);
      if (!node || node.type !== "folder") return;
      inFlightRef.current.add(folderId);
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.add(folderId);
        return next;
      });
      setErrorById((prev) => {
        if (!prev.has(folderId)) return prev;
        const next = new Map(prev);
        next.delete(folderId);
        return next;
      });
      try {
        await onLoadChildren({ nodeId: folderId, node });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load";
        setErrorById((prev) => {
          const next = new Map(prev);
          next.set(folderId, msg);
          return next;
        });
      } finally {
        inFlightRef.current.delete(folderId);
        setLoadingIds((prev) => {
          if (!prev.has(folderId)) return prev;
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
      }
    },
    [onLoadChildren, index],
  );

  useEffect(() => {
    if (!onLoadChildren || currentFolderId === null) return;
    const node = index.get(currentFolderId);
    if (!node || node.type !== "folder") return;
    if (node.children !== undefined) return;
    if (errorById.has(currentFolderId)) return;
    // Defer to the next microtask so the synchronous setLoadingIds inside
    // triggerLoad doesn't violate react-hooks/set-state-in-effect (kickoff
    // for async data fetch — sanctioned pattern).
    queueMicrotask(() => {
      void triggerLoad(currentFolderId);
    });
  }, [currentFolderId, index, onLoadChildren, triggerLoad, errorById]);

  const retry = useCallback(() => {
    if (currentFolderId === null) return;
    setErrorById((prev) => {
      if (!prev.has(currentFolderId)) return prev;
      const next = new Map(prev);
      next.delete(currentFolderId);
      return next;
    });
    void triggerLoad(currentFolderId);
  }, [currentFolderId, triggerLoad]);

  const loadingChildren =
    currentFolderId !== null && loadingIds.has(currentFolderId);
  const loadError =
    currentFolderId !== null
      ? (errorById.get(currentFolderId) ?? null)
      : null;

  return { loadingChildren, loadError, retry };
}

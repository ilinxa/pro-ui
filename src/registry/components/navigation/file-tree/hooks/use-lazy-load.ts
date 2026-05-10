"use client";

import { useCallback, useRef, useState } from "react";
import type { FileTreeLoadChildrenArgs, FsNode } from "../types";

interface UseLazyLoadArgs {
  onLoadChildren?: (args: FileTreeLoadChildrenArgs) => Promise<FsNode[]>;
  setLoadingFolderIds: (next: Set<string>) => void;
}

export interface UseLazyLoadResult {
  /** Per-folder error message, if the most recent load rejected. */
  errors: ReadonlyMap<string, string>;
  /** Trigger a load. Bumps `loadingFolderIds`, resolves cleanly, stores errors. */
  load: (node: FsNode) => Promise<void>;
  /** Clear an error for retry. */
  clearError: (nodeId: string) => void;
}

/**
 * Manages async-children loading state. Does NOT merge resolved children
 * into the tree — that's the consumer's job (we expose `mergeLoadedChildren`
 * helper for that). Tracks loading + error state per folder id.
 */
export function useLazyLoad(args: UseLazyLoadArgs): UseLazyLoadResult {
  const { onLoadChildren, setLoadingFolderIds } = args;
  const loadingRef = useRef<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(() => new Map());

  const setLoading = useCallback(
    (mutator: (prev: Set<string>) => Set<string>) => {
      const next = mutator(new Set(loadingRef.current));
      loadingRef.current = next;
      setLoadingFolderIds(next);
    },
    [setLoadingFolderIds],
  );

  const load = useCallback(
    async (node: FsNode) => {
      if (!onLoadChildren) return;
      if (loadingRef.current.has(node.id)) return;
      setLoading((prev) => {
        prev.add(node.id);
        return prev;
      });
      // Clear any previous error for this id
      setErrors((prev) => {
        if (!prev.has(node.id)) return prev;
        const next = new Map(prev);
        next.delete(node.id);
        return next;
      });
      try {
        await onLoadChildren({ nodeId: node.id, node });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load";
        setErrors((prev) => {
          const next = new Map(prev);
          next.set(node.id, msg);
          return next;
        });
      } finally {
        setLoading((prev) => {
          prev.delete(node.id);
          return prev;
        });
      }
    },
    [onLoadChildren, setLoading],
  );

  const clearError = useCallback((nodeId: string) => {
    setErrors((prev) => {
      if (!prev.has(nodeId)) return prev;
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  return { errors, load, clearError };
}

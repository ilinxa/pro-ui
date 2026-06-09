import { useCallback, useMemo, useRef, useState } from "react";
import type { MediaNode } from "../types";

/** Recursively replace a folder's `children` with cache-loaded children. */
function mergeCache(
  nodes: MediaNode[],
  cache: Record<string, MediaNode[]>,
): MediaNode[] {
  return nodes.map((node) => {
    if (node.type !== "folder") return node;
    const loaded = cache[node.id];
    const children = loaded ?? node.children;
    return {
      ...node,
      children: children ? mergeCache(children, cache) : children,
    };
  });
}

export interface LazyChildrenApi {
  /** Root nodes with lazily-loaded children merged in. */
  nodes: MediaNode[];
  /** Trigger a load for a folder if not cached / in flight. */
  ensureLoaded: (folderId: string) => void;
  /** Drop a folder's cache (or all) so the next visit re-loads. */
  invalidate: (folderId?: string | null) => void;
  loadingIds: ReadonlySet<string>;
  errorIds: Record<string, string>;
}

/**
 * Lazy-children manager: caches `onLoadChildren` results, merges them into the
 * tree, tracks per-folder loading + error. No-op when `onLoadChildren` is
 * absent (the consumer supplies the full tree inline).
 */
export function useLazyChildren(
  rootNodes: MediaNode[],
  onLoadChildren?: (folderId: string) => Promise<MediaNode[]>,
): LazyChildrenApi {
  const [cache, setCache] = useState<Record<string, MediaNode[]>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set());
  const [errorIds, setErrorIds] = useState<Record<string, string>>({});
  const inflight = useRef<Set<string>>(new Set());

  const ensureLoaded = useCallback(
    (folderId: string) => {
      if (!onLoadChildren) return;
      if (cache[folderId] || inflight.current.has(folderId)) return;
      inflight.current.add(folderId);
      setLoadingIds((prev) => new Set(prev).add(folderId));
      setErrorIds((prev) => {
        if (!(folderId in prev)) return prev;
        const next = { ...prev };
        delete next[folderId];
        return next;
      });
      onLoadChildren(folderId)
        .then((children) => {
          setCache((prev) => ({ ...prev, [folderId]: children }));
        })
        .catch((err: unknown) => {
          setErrorIds((prev) => ({
            ...prev,
            [folderId]: (err as Error)?.message || "Failed to load",
          }));
        })
        .finally(() => {
          inflight.current.delete(folderId);
          setLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(folderId);
            return next;
          });
        });
    },
    [onLoadChildren, cache],
  );

  const invalidate = useCallback((folderId?: string | null) => {
    if (folderId == null) {
      setCache({});
      setErrorIds({});
      return;
    }
    setCache((prev) => {
      const next = { ...prev };
      delete next[folderId];
      return next;
    });
    setErrorIds((prev) => {
      const next = { ...prev };
      delete next[folderId];
      return next;
    });
  }, []);

  const nodes = useMemo(() => mergeCache(rootNodes, cache), [rootNodes, cache]);

  return { nodes, ensureLoaded, invalidate, loadingIds, errorIds };
}

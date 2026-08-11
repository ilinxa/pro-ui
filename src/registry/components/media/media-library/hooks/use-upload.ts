import { useCallback, useEffect, useRef, useState } from "react";
import { resolvePreviewKind } from "../lib/preview-kind";
import type { MediaNode, MediaUploadItem, MediaLibraryRootProps } from "../types";

let uploadSeq = 0;
function nextTempId(): string {
  uploadSeq += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(uploadSeq);
  return `upl-${uploadSeq}-${rand}`;
}

export interface UploadApi {
  uploads: MediaUploadItem[];
  start: (files: File[], targetFolderId: string | null) => void;
  retry: (tempId: string) => void;
  dismiss: (tempId: string) => void;
}

/**
 * Optimistic upload orchestration. Invokes `onUpload` once per file, shows a
 * placeholder item with a live progress ring, and on resolve hands the real
 * `MediaNode[]` to the store (which is the source of truth) while removing the
 * placeholder. Owns + revokes the object URLs it mints for local previews.
 */
export function useUpload(
  onUpload: MediaLibraryRootProps["onUpload"],
  onResolved: (nodes: MediaNode[], targetFolderId: string | null) => void,
): UploadApi {
  const [uploads, setUploads] = useState<MediaUploadItem[]>([]);
  const ownedUrls = useRef<Set<string>>(new Set());
  const fileMap = useRef<Map<string, { file: File; targetFolderId: string | null }>>(
    new Map(),
  );
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  });

  const revoke = useCallback((url?: string) => {
    if (url && ownedUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      ownedUrls.current.delete(url);
    }
  }, []);

  const runOne = useCallback(
    (tempId: string, file: File, targetFolderId: string | null) => {
      if (!onUpload) return;
      const progress = (pct: number) =>
        setUploads((prev) =>
          prev.map((u) =>
            u.tempId === tempId
              ? { ...u, pct: Math.max(0, Math.min(100, Math.round(pct))) }
              : u,
          ),
        );
      onUpload([file], targetFolderId, progress)
        .then((nodes) => {
          setUploads((prev) => {
            const item = prev.find((u) => u.tempId === tempId);
            revoke(item?.previewUrl);
            return prev.filter((u) => u.tempId !== tempId);
          });
          fileMap.current.delete(tempId);
          onResolvedRef.current(nodes, targetFolderId);
        })
        .catch((err: unknown) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.tempId === tempId
                ? {
                    ...u,
                    status: "error",
                    error: (err as Error)?.message || "Upload failed",
                  }
                : u,
            ),
          );
        });
    },
    [onUpload, revoke],
  );

  const start = useCallback(
    (files: File[], targetFolderId: string | null) => {
      if (!onUpload || files.length === 0) return;
      const items: MediaUploadItem[] = files.map((file) => {
        const tempId = nextTempId();
        const kind = resolvePreviewKind({
          id: tempId,
          name: file.name,
          type: "file",
          mimeType: file.type,
        } as MediaNode);
        let previewUrl: string | undefined;
        if (file.type.startsWith("image/")) {
          previewUrl = URL.createObjectURL(file);
          ownedUrls.current.add(previewUrl);
        }
        fileMap.current.set(tempId, { file, targetFolderId });
        return {
          tempId,
          name: file.name,
          kind,
          pct: 0,
          status: "uploading" as const,
          previewUrl,
          targetFolderId,
        };
      });
      setUploads((prev) => [...prev, ...items]);
      items.forEach((item) => runOne(item.tempId, fileMap.current.get(item.tempId)!.file, item.targetFolderId));
    },
    [onUpload, runOne],
  );

  const retry = useCallback(
    (tempId: string) => {
      const entry = fileMap.current.get(tempId);
      if (!entry) return;
      setUploads((prev) =>
        prev.map((u) =>
          u.tempId === tempId ? { ...u, status: "uploading", pct: 0, error: undefined } : u,
        ),
      );
      runOne(tempId, entry.file, entry.targetFolderId);
    },
    [runOne],
  );

  const dismiss = useCallback(
    (tempId: string) => {
      setUploads((prev) => {
        const item = prev.find((u) => u.tempId === tempId);
        revoke(item?.previewUrl);
        return prev.filter((u) => u.tempId !== tempId);
      });
      fileMap.current.delete(tempId);
    },
    [revoke],
  );

  // Revoke any outstanding owned URLs on unmount.
  useEffect(() => {
    const owned = ownedUrls.current;
    return () => {
      owned.forEach((url) => URL.revokeObjectURL(url));
      owned.clear();
    };
  }, []);

  return { uploads, start, retry, dismiss };
}

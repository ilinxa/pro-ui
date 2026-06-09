"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { MediaLibrary01 } from "./media-library-01";
import { MediaLibraryRoot } from "./parts/media-library-root";
import { MediaLibraryBreadcrumbs } from "./parts/breadcrumbs";
import { MediaLibraryFolderRow } from "./parts/folder-row";
import { MediaLibraryFileGrid } from "./parts/file-grid";
import { MediaLibraryLightbox } from "./parts/preview-lightbox";
import { FilePreview } from "./parts/file-preview";
import type { MediaNode, MediaUploadProgressFn } from "./types";
import {
  MEDIA_LIBRARY_CHILDREN,
  MEDIA_LIBRARY_NODES,
  MEDIA_LIBRARY_STORAGE,
} from "./dummy-data";

/** A fully-resolved tree (children inlined) so demo mutations reflect immediately. */
const FULL_TREE: MediaNode[] = MEDIA_LIBRARY_NODES.map((n) =>
  n.type === "folder" ? { ...n, children: MEDIA_LIBRARY_CHILDREN[n.id] ?? [] } : n,
);

// ---- tiny immutable tree helpers ----
function removeIds(nodes: MediaNode[], ids: Set<string>): MediaNode[] {
  return nodes
    .filter((n) => !ids.has(n.id))
    .map((n) => (n.children ? { ...n, children: removeIds(n.children, ids) } : n));
}
function renameIn(nodes: MediaNode[], id: string, name: string): MediaNode[] {
  return nodes.map((n) =>
    n.id === id
      ? { ...n, name }
      : n.children
        ? { ...n, children: renameIn(n.children, id, name) }
        : n,
  );
}
function collect(nodes: MediaNode[], ids: Set<string>, out: MediaNode[]) {
  for (const n of nodes) {
    if (ids.has(n.id)) out.push(n);
    if (n.children) collect(n.children, ids, out);
  }
}
function insertInto(nodes: MediaNode[], parentId: string | null, add: MediaNode[]): MediaNode[] {
  if (parentId === null) return [...nodes, ...add];
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children ?? []), ...add] }
      : n.children
        ? { ...n, children: insertInto(n.children, parentId, add) }
        : n,
  );
}
function fileToNode(file: File, parentId: string | null, i: number): MediaNode {
  const url = URL.createObjectURL(file);
  const isImg = file.type.startsWith("image/");
  return {
    id: `up-${Date.now()}-${i}`,
    name: file.name,
    type: "file",
    ext: file.name.split(".").pop(),
    mimeType: file.type,
    size: file.size,
    parentId,
    url,
    thumbnailUrl: isImg ? url : undefined,
    modifiedAt: new Date().toISOString(),
  };
}

function useLibraryState() {
  const [nodes, setNodes] = React.useState<MediaNode[]>(FULL_TREE);

  const onUpload = React.useCallback(
    (files: File[], target: string | null, progress: MediaUploadProgressFn) =>
      new Promise<MediaNode[]>((resolve) => {
        let pct = 0;
        const iv = setInterval(() => {
          pct += 20;
          progress(pct);
          if (pct >= 100) {
            clearInterval(iv);
            const created = files.map((f, i) => fileToNode(f, target, i));
            setNodes((prev) => insertInto(prev, target, created));
            resolve(created);
          }
        }, 200);
      }),
    [],
  );

  const onMove = React.useCallback((ids: string[], target: string | null) => {
    setNodes((prev) => {
      const idSet = new Set(ids);
      const moved: MediaNode[] = [];
      collect(prev, idSet, moved);
      const without = removeIds(prev, idSet);
      return insertInto(
        without,
        target,
        moved.map((m) => ({ ...m, parentId: target })),
      );
    });
  }, []);

  const onRename = React.useCallback(
    (id: string, name: string) => setNodes((prev) => renameIn(prev, id, name)),
    [],
  );
  const onDelete = React.useCallback(
    (ids: string[]) => setNodes((prev) => removeIds(prev, new Set(ids))),
    [],
  );
  const onCreateFolder = React.useCallback(
    (parentId: string | null, name: string) =>
      setNodes((prev) =>
        insertInto(prev, parentId, [
          { id: `fold-${Date.now()}`, name, type: "folder", parentId, children: [] },
        ]),
      ),
    [],
  );

  return { nodes, onUpload, onMove, onRename, onDelete, onCreateFolder };
}

export default function MediaLibrary01Demo() {
  const full = useLibraryState();
  const lighter = useLibraryState();

  return (
    <Tabs defaultValue="full" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="full">Full library</TabsTrigger>
        <TabsTrigger value="lighter">Lighter (composed)</TabsTrigger>
        <TabsTrigger value="readonly">Read-only gallery</TabsTrigger>
        <TabsTrigger value="dispatcher">Just the preview</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="full" className="pt-4">
        <MediaLibrary01
          nodes={full.nodes}
          storage={MEDIA_LIBRARY_STORAGE}
          pdfWorkerSrc={`https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`}
          onUpload={full.onUpload}
          onMove={full.onMove}
          onRename={full.onRename}
          onDelete={full.onDelete}
          onCreateFolder={full.onCreateFolder}
          onDownload={() => {}}
        />
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Drag-drop files to upload, drag a card onto a folder to move, right-click for
          actions, double-click a file to preview.
        </p>
      </TabsContent>

      <TabsContent value="lighter" className="pt-4">
        {/* Hand-assembled: no quota / chips / sidebar / toolbar / details-pane.
            Dropping the parts also drops their weight from the bundle. */}
        <MediaLibraryRoot
          nodes={lighter.nodes}
          onMove={lighter.onMove}
          onDelete={lighter.onDelete}
          preview="lightbox"
        >
          <MediaLibraryBreadcrumbs />
          <MediaLibraryFolderRow />
          <MediaLibraryFileGrid />
          <MediaLibraryLightbox />
        </MediaLibraryRoot>
      </TabsContent>

      <TabsContent value="readonly" className="pt-4">
        {/* No mutation handlers → every mutate affordance hides automatically. */}
        <MediaLibrary01 nodes={FULL_TREE} storage={MEDIA_LIBRARY_STORAGE} showSidebar={false} />
      </TabsContent>

      <TabsContent value="dispatcher" className="pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {[FULL_TREE[4], MEDIA_LIBRARY_CHILDREN["f-brand"][0]].map((node) => (
            <div key={node.id} className="h-64 overflow-hidden rounded-xl border border-border">
              <FilePreview node={node} variant="pane" />
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          The standalone <code>&lt;FilePreview&gt;</code> dispatcher — no library shell.
        </p>
      </TabsContent>
    </Tabs>
  );
}

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
// VALUE import from file-tree's .tsx entry (F-01-safe); structural typing bridges
// MediaNode[] → FsNode[] at the `nodes` boundary (no cross-procomp type import).
import { FileTree } from "../../../navigation/file-tree/file-tree";
import { findNode } from "../lib/drag";
import { useMediaLibrary } from "../hooks/use-media-library";
import type { MediaNode } from "../types";

/** Synthetic root row so the tree shows (and can navigate back to) the library root. */
const ROOT_ID = "__media_library_root__";

/** Tier B — navigation + move sidebar (composes the shipped `file-tree`). */
export function MediaLibrarySidebar({ className }: { className?: string }) {
  const ctx = useMediaLibrary();

  // A "Library" root node whose children are the whole tree, so the root is
  // visible/selectable and folders show their real contents (no false "empty").
  const tree = useMemo<MediaNode[]>(
    () => [
      {
        id: ROOT_ID,
        name: ctx.labels.libraryHeading,
        type: "folder",
        children: ctx.nodes,
      },
    ],
    [ctx.nodes, ctx.labels.libraryHeading],
  );

  const selectedIds = useMemo(
    () => new Set([ctx.currentFolderId ?? ROOT_ID]),
    [ctx.currentFolderId],
  );
  const defaultExpandedIds = useMemo(() => new Set([ROOT_ID]), []);

  // Folder → navigate (ROOT → root); file → preview.
  const activate = (id: string) => {
    if (id === ROOT_ID) {
      ctx.navigateTo(null);
      return;
    }
    const node = findNode(ctx.nodes, id);
    if (!node) return;
    if (node.type === "folder") ctx.navigateTo(id);
    else if (ctx.canPreview) ctx.openPreview(id);
  };

  return (
    <aside
      className={cn(
        "hidden w-56 shrink-0 overflow-auto rounded-xl border border-border bg-card p-2 md:block",
        className,
      )}
    >
      <FileTree
        nodes={tree}
        selectionMode="single"
        selectedIds={selectedIds}
        defaultExpandedIds={defaultExpandedIds}
        header={false}
        contextMenu={false}
        enableInternalDrag={ctx.enableInternalDrag && ctx.can.move}
        onOpen={(args) => activate(args.node.id)}
        onSelectedChange={(args) => {
          const first = Array.from(args.ids)[0];
          if (first !== undefined) activate(first);
        }}
        onMove={(args) => {
          // Only "inside" = re-parent into a folder (we don't do sibling reorder).
          if (args.position !== "inside") return;
          const ids = args.ids.filter((id) => id !== ROOT_ID);
          if (ids.length === 0) return;
          ctx.moveTo(ids, args.targetId === ROOT_ID ? null : args.targetId);
        }}
      />
    </aside>
  );
}

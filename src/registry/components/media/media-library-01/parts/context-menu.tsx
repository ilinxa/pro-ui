"use client";

import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useMediaLibrary } from "../hooks/use-media-library";
import type { MediaNode } from "../types";

/**
 * Wraps a card with a selection-aware right-click menu. When the node is part
 * of a multi-selection the verbs act on the whole selection; otherwise on the
 * node alone. Returns children untouched when `enableContextMenu` is false.
 */
export function MediaItemContextMenu({
  node,
  children,
}: {
  node: MediaNode;
  children: ReactNode;
}) {
  const ctx = useMediaLibrary();
  if (!ctx.enableContextMenu) return <>{children}</>;

  const { labels, can, clipboard } = ctx;
  const ids =
    ctx.selectedIds.has(node.id) && ctx.selectedIds.size > 1
      ? Array.from(ctx.selectedIds)
      : [node.id];
  const isFile = node.type === "file";
  const isFolder = node.type === "folder";
  const canPasteHere = can.move && isFolder && clipboard.kind === "cut" && clipboard.ids.length > 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        {isFolder ? (
          <ContextMenuItem onSelect={() => ctx.navigateTo(node.id)}>
            {labels.open}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={() => ctx.openPreview(node.id)}>
            {labels.preview}
          </ContextMenuItem>
        )}
        {can.rename ? (
          <ContextMenuItem onSelect={() => ctx.startRename(node.id)}>
            {labels.rename}
          </ContextMenuItem>
        ) : null}
        {can.move ? (
          <ContextMenuItem onSelect={() => ctx.cut(ids)}>
            {labels.cut}
          </ContextMenuItem>
        ) : null}
        {canPasteHere ? (
          <ContextMenuItem onSelect={() => ctx.moveTo(clipboard.ids, node.id)}>
            {labels.paste}
          </ContextMenuItem>
        ) : null}
        {can.download && isFile ? (
          <ContextMenuItem onSelect={() => ctx.download(ids)}>
            {labels.download}
          </ContextMenuItem>
        ) : null}
        {can.delete ? (
          <>
            <ContextMenuSeparator />
            {/* F-cross-13: style destructive via className, not a `variant`
                prop — consumer primitives (base-nova / Base UI) may lack it. */}
            <ContextMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => ctx.requestDelete(ids)}
            >
              {labels.delete}
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

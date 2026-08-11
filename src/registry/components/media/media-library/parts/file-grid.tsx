"use client";

import { GripVertical, ImageOff, UploadCloud } from "lucide-react";
import type { KeyboardEvent, MouseEvent, PointerEventHandler } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolvePreviewKind } from "../lib/preview-kind";
import { useMediaLibrary } from "../hooks/use-media-library";
import { MediaItemContextMenu } from "./context-menu";
import { FileCard } from "./file-card";
import { RenameInput } from "./rename-input";
import { UploadProgressCard } from "./upload-progress";
import type { MediaNode } from "../types";

const GRID_CLASS =
  "grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3";

function ConnectedFileCard({ node }: { node: MediaNode }) {
  const ctx = useMediaLibrary();
  const selected = ctx.selection.isSelected(node.id);
  const kind = resolvePreviewKind(node);
  const ids =
    ctx.selectedIds.has(node.id) && ctx.selectedIds.size > 1
      ? Array.from(ctx.selectedIds)
      : [node.id];

  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: node.id,
    data: { type: "media-node", ids },
    disabled: !ctx.enableInternalDrag || !ctx.can.move,
  });

  const onClick = (e: MouseEvent) =>
    ctx.selection.handleItemClick(
      node.id,
      { metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey },
      ctx.visibleIds,
    );
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (ctx.canPreview) ctx.openPreview(node.id);
    } else if (e.key === " ") {
      e.preventDefault();
      ctx.selection.toggle(node.id);
    }
  };

  return (
    <MediaItemContextMenu node={node}>
      <FileCard
        ref={setNodeRef}
        node={node}
        kind={kind}
        selected={selected}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={ctx.labels.itemAria
          .replace("{name}", node.name)
          .replace("{kind}", kind)}
        onClick={onClick}
        onDoubleClick={() => ctx.canPreview && ctx.openPreview(node.id)}
        onKeyDown={onKeyDown}
        onPointerDown={
          listeners?.onPointerDown as PointerEventHandler<HTMLDivElement> | undefined
        }
        style={isDragging ? { opacity: 0.4 } : undefined}
        renaming={
          ctx.renamingId === node.id ? (
            <RenameInput
              initial={node.name}
              error={ctx.renameError}
              onSubmit={(v) => ctx.submitRename(node.id, v)}
              onCancel={ctx.cancelRename}
            />
          ) : undefined
        }
        dragHandle={
          ctx.enableInternalDrag && ctx.can.move ? (
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`${ctx.labels.move}: ${node.name}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-2 cursor-grab rounded bg-background/70 p-1 text-muted-foreground opacity-50 shadow-sm ring-1 ring-border backdrop-blur-sm transition-opacity hover:bg-background focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/file:opacity-100"
            >
              <GripVertical className="size-3.5" aria-hidden="true" />
            </button>
          ) : undefined
        }
      />
    </MediaItemContextMenu>
  );
}

/** Tier B — FILES section: heading + thumbnail grid + uploads + empty/loading states. */
export function MediaLibraryFileGrid({ className }: { className?: string }) {
  const {
    files,
    folders,
    uploads,
    labels,
    loadingChildren,
    loadError,
    currentFolderId,
    refresh,
    can,
    triggerUpload,
    creatingFolder,
  } = useMediaLibrary();

  if (loadingChildren) {
    return (
      <section className={cn("flex flex-col gap-2", className)}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {labels.filesHeading}
        </h3>
        <div className={GRID_CLASS}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/3 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-card p-8 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button variant="outline" size="sm" onClick={() => refresh(currentFolderId)}>
          {labels.retry}
        </Button>
      </div>
    );
  }

  const totallyEmpty =
    folders.length === 0 && files.length === 0 && uploads.length === 0 && !creatingFolder;

  if (totallyEmpty) {
    const isRoot = currentFolderId == null;
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          {isRoot ? (
            <UploadCloud className="size-6" aria-hidden="true" />
          ) : (
            <ImageOff className="size-6" aria-hidden="true" />
          )}
        </span>
        <p className="text-sm text-muted-foreground">
          {isRoot ? labels.emptyLibrary : labels.emptyFolder}
        </p>
        {can.upload ? (
          <Button size="sm" onClick={triggerUpload}>
            <UploadCloud className="size-4" aria-hidden="true" />
            {labels.uploadButton}
          </Button>
        ) : null}
      </div>
    );
  }

  if (files.length === 0 && uploads.length === 0) return null;

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {labels.filesHeading}
      </h3>
      <div className={GRID_CLASS}>
        {uploads.map((item) => (
          <UploadProgressCard key={item.tempId} item={item} />
        ))}
        {files.map((node) => (
          <ConnectedFileCard key={node.id} node={node} />
        ))}
      </div>
    </section>
  );
}

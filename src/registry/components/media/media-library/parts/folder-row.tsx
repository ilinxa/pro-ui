"use client";

import { GripVertical } from "lucide-react";
import type { KeyboardEvent, MouseEvent, PointerEventHandler, Ref } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "../hooks/use-media-library";
import { DROP_PREFIX } from "./media-library-root";
import { MediaItemContextMenu } from "./context-menu";
import { FolderCard } from "./folder-card";
import { RenameInput } from "./rename-input";
import type { MediaNode } from "../types";

function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref && "current" in ref) (ref as { current: T | null }).current = node;
    }
  };
}

function ConnectedFolderCard({ node }: { node: MediaNode }) {
  const ctx = useMediaLibrary();
  const selected = ctx.selection.isSelected(node.id);
  const ids =
    ctx.selectedIds.has(node.id) && ctx.selectedIds.size > 1
      ? Array.from(ctx.selectedIds)
      : [node.id];

  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
    id: node.id,
    data: { type: "media-node", ids },
    disabled: !ctx.enableInternalDrag || !ctx.can.move,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${DROP_PREFIX}${node.id}`,
  });

  const isDropTarget =
    isOver && ctx.activeDragIds != null && ctx.canDrop(ctx.activeDragIds, node.id);

  const onClick = (e: MouseEvent) =>
    ctx.selection.handleItemClick(
      node.id,
      { metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey },
      ctx.visibleIds,
    );
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ctx.navigateTo(node.id);
    } else if (e.key === " ") {
      e.preventDefault();
      ctx.selection.toggle(node.id);
    }
  };

  return (
    <MediaItemContextMenu node={node}>
      <FolderCard
        ref={composeRefs(setDragRef, setDropRef)}
        node={node}
        selected={selected}
        itemCount={node.children?.length}
        isDropTarget={isDropTarget}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={ctx.labels.itemAria
          .replace("{name}", node.name)
          .replace("{kind}", "folder")}
        onClick={onClick}
        onDoubleClick={() => ctx.navigateTo(node.id)}
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
              className="shrink-0 cursor-grab rounded p-1 text-muted-foreground/40 transition-colors hover:bg-accent hover:text-muted-foreground focus-visible:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/folder:text-muted-foreground/70"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </button>
          ) : undefined
        }
      />
    </MediaItemContextMenu>
  );
}

/** Tier B — FOLDERS section: heading + folder-card grid + inline new-folder editor. */
export function MediaLibraryFolderRow({ className }: { className?: string }) {
  const { folders, labels, creatingFolder, submitCreateFolder, cancelCreateFolder } =
    useMediaLibrary();

  if (folders.length === 0 && !creatingFolder) return null;

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {labels.foldersHeading}
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
        {creatingFolder ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-card p-3 shadow-sm">
            <span className="size-10 shrink-0 rounded-lg bg-primary/10" />
            <RenameInput
              initial=""
              placeholder={labels.newFolderButton}
              onSubmit={submitCreateFolder}
              onCancel={cancelCreateFolder}
              className="flex-1"
            />
          </div>
        ) : null}
        {folders.map((node) => (
          <ConnectedFolderCard key={node.id} node={node} />
        ))}
      </div>
    </section>
  );
}

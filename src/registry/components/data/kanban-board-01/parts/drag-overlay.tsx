"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DragOverlay } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { AnyKanbanCardRenderer, KanbanItem, KanbanRenderContext } from "../types";
import { ItemRenderer } from "./item-renderer";

export function KanbanDragOverlay({
  activeItem,
  rendererMap,
}: {
  activeItem: KanbanItem | null;
  rendererMap: Map<string, AnyKanbanCardRenderer>;
}) {
  // Portal the overlay into <body> so a transformed ancestor above the board
  // can't become the containing block for dnd-kit's `position: fixed` overlay
  // and offset the drag ghost from the pointer. (`transform`, `filter`,
  // `perspective`, `will-change: transform`, and `contain: paint` all create a
  // containing block — entrance-animation wrappers are the common culprit.)
  // React context flows through portals, so the overlay stays bound to
  // DndContext. Gate on a client-mount flag so SSR / pre-hydration renders
  // nothing (document is absent on the server). `useSyncExternalStore` with a
  // `false` server snapshot is the repo's SSR-safe client-detect primitive —
  // it avoids the React-19 set-state-in-effect antipattern.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const overlay = (
    <DragOverlay dropAnimation={null}>
      {activeItem ? (
        <div
          className={cn(
            "w-80 rotate-2 cursor-grabbing rounded-md shadow-2xl",
            "ring-2 ring-ring/40",
          )}
        >
          <ItemRenderer
            item={activeItem}
            rendererMap={rendererMap}
            ctx={
              {
                itemId: activeItem.id,
                columnId: "",
                swimlaneId: activeItem.swimlaneId,
                isDragging: true,
                isLocked: activeItem.locked === true,
              } satisfies KanbanRenderContext
            }
          />
        </div>
      ) : null}
    </DragOverlay>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}

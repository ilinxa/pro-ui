"use client";

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
  return (
    <DragOverlay dropAnimation={null}>
      {activeItem ? (
        <div
          className={cn(
            "w-72 rotate-2 cursor-grabbing rounded-md shadow-2xl",
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
}

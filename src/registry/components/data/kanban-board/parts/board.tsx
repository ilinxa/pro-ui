"use client";

import { useEffect, useRef } from "react";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type {
  AnyKanbanCardRenderer,
  KanbanColumn,
  KanbanData,
  KanbanItem,
  KanbanPaletteSwatch,
  KanbanSwimlane,
} from "../types";
import { AddColumnButton } from "./add-column-button";
import { Column } from "./column";

export function Board({
  data,
  swimlanes,
  rendererMap,
  renderers,
  palette,
  readOnly,
  activeRendererId,
  onItemCreate,
  onItemUpdate,
  onItemDelete,
  onItemClick,
  onItemDataChange,
  onColumnCreate,
  onColumnUpdate,
  onColumnDelete,
  onSetColor,
  onToggleCollapse,
  className,
}: {
  data: KanbanData;
  swimlanes: KanbanSwimlane[] | undefined;
  rendererMap: Map<string, AnyKanbanCardRenderer>;
  renderers: AnyKanbanCardRenderer[];
  palette: KanbanPaletteSwatch[];
  readOnly: boolean;
  activeRendererId: string | undefined;
  onItemCreate?: (columnId: string, item: KanbanItem) => void;
  onItemUpdate?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  onItemDataChange?: (item: KanbanItem) => void;
  onColumnCreate?: (column: KanbanColumn) => void;
  onColumnUpdate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onSetColor: (columnId: string, color: string | undefined) => void;
  onToggleCollapse: (columnId: string) => void;
  className?: string;
}) {
  // Translate a vertical mouse-wheel delta into horizontal scroll so a plain
  // mouse can reach every column (a horizontal-only scroller ignores deltaY).
  // Yields to a column under the pointer that can still scroll vertically in
  // that direction. Attached non-passive because React's onWheel is passive —
  // a passive listener can't preventDefault to stop the page also scrolling.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || e.shiftKey) return; // shift+wheel already scrolls X
      if (el.scrollWidth <= el.clientWidth) return; // nothing to scroll horizontally
      let node = e.target as HTMLElement | null;
      while (node && node !== el) {
        const oy = getComputedStyle(node).overflowY;
        if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
          const atTop = node.scrollTop <= 0;
          const atBottom = Math.ceil(node.scrollTop + node.clientHeight) >= node.scrollHeight;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
        }
        node = node.parentElement;
      }
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex h-full min-h-0 w-full gap-3 overflow-x-auto overflow-y-hidden p-3",
        className,
      )}
    >
      <SortableContext
        items={data.columns.map((c) => c.id)}
        strategy={horizontalListSortingStrategy}
      >
        {data.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            swimlanes={swimlanes}
            rendererMap={rendererMap}
            renderers={renderers}
            palette={palette}
            readOnly={readOnly}
            activeRendererId={activeRendererId}
            onItemCreate={onItemCreate ? (item) => onItemCreate(column.id, item) : undefined}
            onItemUpdate={onItemUpdate}
            onItemDelete={onItemDelete}
            onItemClick={onItemClick}
            onItemDataChange={onItemDataChange}
            onColumnUpdate={onColumnUpdate}
            onColumnDelete={onColumnDelete}
            onSetColor={(color) => onSetColor(column.id, color)}
            onToggleCollapse={() => onToggleCollapse(column.id)}
          />
        ))}
      </SortableContext>
      {!readOnly && onColumnCreate ? <AddColumnButton onCreate={onColumnCreate} /> : null}
    </div>
  );
}

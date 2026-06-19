"use client";

import { cn } from "@/lib/utils";
import type {
  AnyKanbanCardRenderer,
  KanbanColumn,
  KanbanItem,
  KanbanSwimlane,
} from "../types";
import { SwimlaneCell } from "./swimlane-cell";

export function ColumnBody({
  column,
  swimlanes,
  rendererMap,
  readOnly,
  activeRendererId,
  onItemClick,
  onItemDelete,
  onItemEdit,
  onItemDataChange,
}: {
  column: KanbanColumn;
  swimlanes: KanbanSwimlane[] | undefined;
  rendererMap: Map<string, AnyKanbanCardRenderer>;
  readOnly: boolean;
  activeRendererId: string | undefined;
  onItemClick?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onItemEdit?: (item: KanbanItem) => void;
  onItemDataChange?: (item: KanbanItem) => void;
}) {
  // A drop is rejected if there's an active drag and this column doesn't accept that renderer.
  const rejectDrop =
    activeRendererId !== undefined &&
    column.acceptsRendererIds !== undefined &&
    !column.acceptsRendererIds.includes(activeRendererId);

  const hasSwimlanes = !!(swimlanes && swimlanes.length > 0);
  const lanes: (KanbanSwimlane | undefined)[] =
    swimlanes && swimlanes.length > 0 ? swimlanes : [undefined];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1.5">
      {/* In single-lane mode the lone cell grows to fill the column so the whole
          empty area below the cards is a (highlighted) drop target. In swimlane
          mode each lane cell stays content-sized so the lanes stack + scroll. */}
      <div className={cn("flex flex-col gap-2 py-1.5", !hasSwimlanes && "min-h-full")}>
        {lanes.map((lane) => {
          const items = column.items.filter((it) => {
            if (!swimlanes || swimlanes.length === 0) return true;
            // If item's swimlaneId is missing or unknown, it lands in the first lane.
            const known = swimlanes.some((l) => l.id === it.swimlaneId);
            if (!known) return lane?.id === swimlanes[0].id;
            return it.swimlaneId === lane?.id;
          });
          return (
            <div
              key={lane?.id ?? "_"}
              className={cn("flex flex-col gap-1", !hasSwimlanes && "flex-1")}
            >
              {lane ? (
                <span className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  {lane.title}
                </span>
              ) : null}
              <SwimlaneCell
                column={column}
                swimlaneId={lane?.id}
                items={items}
                rendererMap={rendererMap}
                readOnly={readOnly}
                rejectDrop={rejectDrop}
                grow={!hasSwimlanes}
                onItemClick={onItemClick}
                onItemDelete={onItemDelete}
                onItemEdit={onItemEdit}
                onItemDataChange={onItemDataChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

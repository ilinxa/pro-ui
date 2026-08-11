"use client";

import { useDroppable } from "@dnd-kit/core";
import { ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { swatchCssColor, findSwatch } from "../lib/palette";
import type { KanbanColumn, KanbanPaletteSwatch } from "../types";

export function ColumnCollapsed({
  column,
  palette,
  onExpand,
}: {
  column: KanbanColumn;
  palette: KanbanPaletteSwatch[];
  onExpand: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${column.id}::collapsed`,
    data: { kind: "collapsed-column", columnId: column.id },
  });

  const swatch = findSwatch(palette, column.color);
  const accentColor = swatchCssColor(swatch);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-10 shrink-0 flex-col items-center justify-between border-l-2 bg-card/50 py-2",
        "rounded-md border border-border",
        isOver && "ring-1 ring-ring",
      )}
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={onExpand}
        aria-label={`Expand column ${column.title}`}
      >
        <ChevronsRight className="size-3.5" />
      </Button>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <span
          className="text-xs font-medium text-foreground"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {column.title}
        </span>
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{column.items.length}</span>
    </div>
  );
}

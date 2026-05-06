"use client";

import { ChevronsLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { KanbanColumn, KanbanPaletteSwatch } from "../types";
import { ColumnColorPicker } from "./color-picker";

export function ColumnHeader({
  column,
  palette,
  readOnly,
  itemCount,
  dragHandleProps,
  onColorChange,
  onCollapse,
  onEdit,
  onDelete,
}: {
  column: KanbanColumn;
  palette: KanbanPaletteSwatch[];
  readOnly: boolean;
  itemCount: number;
  dragHandleProps?: Record<string, unknown>;
  onColorChange: (color: string | undefined) => void;
  onCollapse: () => void;
  onEdit?: (column: KanbanColumn) => void;
  onDelete?: (columnId: string) => void;
}) {
  const showMenu = !readOnly && (onEdit || onDelete);
  const overCap = column.maxItems !== undefined && itemCount > column.maxItems;

  return (
    <div className="flex items-center gap-1 px-2.5 py-2">
      <div
        {...(readOnly ? {} : dragHandleProps)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          !readOnly && "cursor-grab active:cursor-grabbing",
        )}
      >
        <span className="truncate text-sm font-medium text-foreground">{column.title}</span>
        <span
          className={cn(
            "shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
            overCap ? "bg-destructive/15 text-destructive" : "text-muted-foreground",
          )}
        >
          {column.maxItems !== undefined ? `${itemCount} / ${column.maxItems}` : itemCount}
        </span>
      </div>
      <div className="flex shrink-0 items-center" data-stop-click onPointerDown={(e) => e.stopPropagation()}>
        {!readOnly ? (
          <ColumnColorPicker
            palette={palette}
            current={column.color}
            onChange={onColorChange}
          />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onCollapse}
          aria-label={`Collapse column ${column.title}`}
          data-stop-click
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        {showMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label="Column menu"
                data-stop-click
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit ? (
                <DropdownMenuItem onClick={() => onEdit(column)}>
                  <Pencil className="size-3.5" />
                  Rename column
                </DropdownMenuItem>
              ) : null}
              {onEdit && onDelete ? <DropdownMenuSeparator /> : null}
              {onDelete ? (
                <DropdownMenuItem
                  onClick={() => onDelete(column.id)}
                  variant="destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete column
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

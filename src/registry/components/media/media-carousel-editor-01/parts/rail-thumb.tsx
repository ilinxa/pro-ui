"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Film, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaCarouselItem } from "../types";

export interface RailThumbProps {
  item: MediaCarouselItem;
  index: number;
  total: number;
  selected: boolean;
  /** Editing in progress → rail is read-only (no drag, remove, or re-select). */
  disabled: boolean;
  labels: { remove: string; reorderHint: string; itemAria: string };
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * A single rail thumbnail. The body is a native `<button>` for select (clean
 * Enter/Space keyboard activation). The drag `listeners` live on a SEPARATE
 * handle button so the `@dnd-kit` keyboard sensor never fights the select
 * button's native activation. Remove is a third button with `stopPropagation`.
 */
export function RailThumb({
  item,
  index,
  total,
  selected,
  disabled,
  labels,
  onSelect,
  onRemove,
}: RailThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const aria = labels.itemAria
    .replace("{n}", String(index + 1))
    .replace("{total}", String(total))
    .replace("{kind}", item.kind);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group relative shrink-0", isDragging && "z-10 opacity-60")}
    >
      <button
        type="button"
        aria-label={aria}
        aria-current={selected ? "true" : undefined}
        onClick={() => !disabled && onSelect(item.id)}
        disabled={disabled}
        className={cn(
          "relative block size-16 overflow-hidden rounded-md border bg-muted outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
          selected ? "border-ring ring-2 ring-ring" : "border-border",
        )}
      >
        {item.kind === "video" ? (
          <>
            <video
              src={item.url}
              muted
              preload="metadata"
              className="size-full object-cover"
            />
            <span className="absolute bottom-0.5 right-0.5 grid place-items-center rounded-sm bg-black/60 p-0.5 text-white">
              <Film className="size-3" aria-hidden />
            </span>
          </>
        ) : (
          <img
            src={item.url}
            alt={item.fileName ?? ""}
            className="size-full object-cover"
          />
        )}
      </button>

      {!disabled ? (
        <>
          <button
            type="button"
            aria-label={labels.reorderHint}
            {...attributes}
            {...listeners}
            className="absolute bottom-0.5 left-0.5 grid size-5 cursor-grab touch-none place-items-center rounded bg-black/55 text-white opacity-80 transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={labels.remove}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}

"use client";

import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MediaCarouselItem, MediaKind } from "../types";
import { MediaDropzone } from "./media-dropzone";
import { RailThumb } from "./rail-thumb";

export interface PreviewRailProps {
  items: MediaCarouselItem[];
  selectedId: string | null;
  /** Editing in progress → the whole rail is read-only. */
  disabled: boolean;
  canAddMore: boolean;
  /** Ingestion in progress — spinner on the add-more tile. */
  busy?: boolean;
  accept: MediaKind[];
  maxItems: number;
  labels: {
    remove: string;
    reorderHint: string;
    itemAria: string;
    dropzoneTitle: string;
    dropzoneBrowse: string;
    dropzoneHint: string;
    addMore: string;
    finishEditingHint: string;
  };
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onFiles: (files: FileList) => void;
}

/**
 * Horizontal thumbnail strip. `SortableContext` (horizontal strategy) drives
 * reorder; the wrapping `DndContext` lives in the root component. A trailing
 * compact dropzone tile adds more items when under `maxItems` and not editing.
 */
export function PreviewRail({
  items,
  selectedId,
  disabled,
  canAddMore,
  busy,
  accept,
  maxItems,
  labels,
  onSelect,
  onRemove,
  onFiles,
}: PreviewRailProps) {
  return (
    <ScrollArea className="w-full">
      {disabled ? (
        <p className="px-1 pb-1 text-xs text-muted-foreground">
          {labels.finishEditingHint}
        </p>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-2 p-1 transition-opacity",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <SortableContext
          items={items.map((it) => it.id)}
          strategy={horizontalListSortingStrategy}
        >
          {items.map((item, i) => (
            <RailThumb
              key={item.id}
              item={item}
              index={i}
              total={items.length}
              selected={item.id === selectedId}
              disabled={disabled}
              labels={labels}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
        {canAddMore && !disabled ? (
          <MediaDropzone
            variant="add-more"
            accept={accept}
            maxItems={maxItems}
            busy={busy}
            labels={labels}
            onFiles={onFiles}
          />
        ) : null}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

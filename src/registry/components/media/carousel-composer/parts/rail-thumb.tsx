"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Film, GripVertical, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultCarouselComposerLabels } from "../types";
import type { CarouselComposerLabels, MediaCarouselItem } from "../types";
import { clampOffset, thumbHeightRem, thumbWidthRem } from "../lib/aspect";
import { UploadProgress, clampProgress } from "./upload-progress";

export interface RailThumbProps {
  item: MediaCarouselItem;
  index: number;
  total: number;
  selected: boolean;
  /** Editing in progress → rail is read-only (no drag, remove, or re-select). */
  disabled: boolean;
  labels: Pick<
    CarouselComposerLabels,
    | "removeItem"
    | "reorderHint"
    | "itemAria"
    | "uploadProgress"
    | "uploadFailed"
    | "retry"
    | "durationLabel"
    | "moveEarlier"
    | "moveLater"
  >;
  /** Shared aspect as width / height (`null` = free, square). The thumb keeps its height. */
  ratio?: number | null;
  /** Formats the duration badge of a video. */
  formatDuration: (seconds: number) => string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  /** Shows a Retry on an errored thumb (the selected item's Retry is under the preview). */
  onRetry?: (item: MediaCarouselItem) => void;
  /** `reorderButtons`: render the move earlier / later pair. */
  reorderButtons?: boolean;
  /** One-step move; `delta` is -1 (earlier) or 1 (later). */
  onMove?: (id: string, delta: number) => void;
}

/**
 * A single rail thumbnail. The body is a native `<button>` for select (clean
 * Enter/Space keyboard activation). The drag `listeners` live on a SEPARATE
 * handle button so the `@dnd-kit` keyboard sensor never fights the select
 * button's native activation. Remove is a third button with `stopPropagation`.
 * Upload status (`uploading` / `pending` / `error`) shows on the thumb; for the
 * selected item the accessible progress and Retry live under the preview instead.
 */
export function RailThumb({
  item,
  index,
  total,
  selected,
  disabled,
  labels,
  ratio = 1,
  formatDuration,
  onSelect,
  onRemove,
  onRetry,
  reorderButtons = false,
  onMove,
}: RailThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const aria = labels.itemAria({
    position: index + 1,
    total,
    kind: item.kind,
    alt: item.alt,
    status: item.status,
  });
  const progress = clampProgress(item.progress);
  const errorText = item.error ?? labels.uploadFailed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group relative shrink-0", isDragging && "z-10 opacity-60")}
    >
      <button
        type="button"
        aria-label={aria}
        data-thumb-select={item.id}
        aria-current={selected ? "true" : undefined}
        onClick={() => !disabled && onSelect(item.id)}
        disabled={disabled}
        style={{ width: `${thumbWidthRem(ratio)}rem`, height: `${thumbHeightRem(ratio)}rem` }}
        className={cn(
          "relative block overflow-hidden rounded-md border bg-muted outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
          selected ? "border-ring ring-2 ring-ring" : "border-border",
          item.status === "pending" && "opacity-70",
        )}
      >
        {item.kind === "video" ? (
          <>
            {item.posterUrl ? (
              <img src={item.posterUrl} alt="" className="size-full object-cover" />
            ) : (
              <video
                src={item.url}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  // Nudge to a frame so the thumb isn't a black box (Safari/Chrome
                  // won't paint frame 0 of an unplayed inline video otherwise).
                  try {
                    e.currentTarget.currentTime = 0.1;
                  } catch {
                    /* seeking unsupported — leave as-is */
                  }
                }}
                className="size-full object-cover"
              />
            )}
            {item.duration === undefined ? (
              <span className="absolute bottom-0.5 end-0.5 grid place-items-center rounded-sm bg-media-overlay p-0.5 text-media-overlay-foreground">
                <Film className="size-3" aria-hidden />
              </span>
            ) : null}
          </>
        ) : (
          <img
            src={item.url}
            alt={item.alt ?? item.fileName ?? ""}
            style={
              item.cropOffset
                ? {
                    objectPosition: `${clampOffset(item.cropOffset.x) * 100}% ${clampOffset(item.cropOffset.y) * 100}%`,
                  }
                : undefined
            }
            className="size-full object-cover"
          />
        )}
      </button>

      {item.kind === "video" && item.duration !== undefined ? (
        <span
          role="img"
          aria-label={labels.durationLabel(formatDuration(item.duration))}
          className="pointer-events-none absolute bottom-0.5 end-0.5 rounded-sm bg-media-overlay px-1 text-[10px] font-medium leading-4 text-media-overlay-foreground tabular-nums"
        >
          {formatDuration(item.duration)}
        </span>
      ) : null}

      {item.status === "uploading" ? (
        <div className="pointer-events-none absolute inset-x-1 top-1">
          <UploadProgress
            progress={progress}
            itemId={item.id}
            label={labels.uploadProgress(progress, { position: index + 1, total })}
            decorative={selected}
            className="h-1"
          />
        </div>
      ) : null}

      {item.status === "pending" ? (
        <span className="pointer-events-none absolute start-1 top-1 grid place-items-center rounded-sm bg-media-overlay p-0.5 text-media-overlay-foreground">
          <Clock className="size-3" aria-hidden />
        </span>
      ) : null}

      {item.status === "error" ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-start rounded-md bg-destructive/60 p-1">
          <AlertCircle
            role={selected ? undefined : "img"}
            aria-label={selected ? undefined : errorText}
            aria-hidden={selected ? true : undefined}
            className="size-4 text-destructive-foreground"
          />
        </div>
      ) : null}

      {item.status === "error" && onRetry && !selected && !disabled ? (
        <button
          type="button"
          aria-label={labels.retry}
          onClick={(e) => {
            e.stopPropagation();
            onRetry(item);
          }}
          className="absolute inset-0 m-auto grid size-6 place-items-center rounded-full bg-destructive text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCw className="size-3.5" aria-hidden />
        </button>
      ) : null}

      {!disabled ? (
        <>
          <button
            type="button"
            aria-label={labels.reorderHint}
            {...attributes}
            {...listeners}
            className="absolute bottom-0.5 start-0.5 grid size-6 cursor-grab touch-none place-items-center rounded bg-media-overlay text-media-overlay-foreground opacity-90 transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          {reorderButtons ? (
            <div
              data-thumb-move-pair=""
              className={cn(
                "pointer-events-none absolute flex opacity-0 transition-opacity",
                "group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100",
                // Geometry (rem = 16px). Remove is size-6 at -top-1.5 / -end-1.5, so it covers
                // y -6..18 of the thumb; the grip is size-6 at bottom-0.5 / start-0.5, so it
                // covers y (H-26)..(H-2). A narrow thumb (9:16 = 36 px wide, 64 px tall) has no
                // room beside either, so the pair sits in the 20 px band between them
                // (top-5 .. 36 px; two size-4 buttons = 32 px wide, centred, no wider than themselves). A wider thumb (>= 5 rem)
                // has room on the bottom row right of the grip (start-[1.875rem]).
                thumbWidthRem(ratio) >= 5
                  ? "bottom-0.5 start-[1.875rem] gap-0.5"
                  : "inset-x-0 top-5 mx-auto w-fit",
              )}
            >
              {(["earlier", "later"] as const).map((which) => {
                const delta = which === "earlier" ? -1 : 1;
                const atEnd = which === "earlier" ? index === 0 : index === total - 1;
                const name = (
                  (which === "earlier" ? labels.moveEarlier : labels.moveLater) ??
                  (which === "earlier"
                    ? defaultCarouselComposerLabels.moveEarlier
                    : defaultCarouselComposerLabels.moveLater)!
                )({ position: index + 1, total });
                const Icon = which === "earlier" ? ChevronLeft : ChevronRight;
                return (
                  <button
                    key={which}
                    type="button"
                    aria-label={name}
                    // Not `disabled`: a focused button that disables itself drops focus to <body>.
                    aria-disabled={atEnd || undefined}
                    data-thumb-move={which}
                    data-thumb-id={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!atEnd) onMove?.(item.id, delta);
                    }}
                    className={cn(
                      "grid place-items-center rounded bg-media-overlay text-media-overlay-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-50",
                      thumbWidthRem(ratio) >= 5 ? "size-5" : "size-4",
                    )}
                  >
                    <Icon className="size-3 rtl:rotate-180" aria-hidden />
                  </button>
                );
              })}
            </div>
          ) : null}
          <button
            type="button"
            aria-label={labels.removeItem({ position: index + 1, total, kind: item.kind })}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="absolute -end-1.5 -top-1.5 grid size-6 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}

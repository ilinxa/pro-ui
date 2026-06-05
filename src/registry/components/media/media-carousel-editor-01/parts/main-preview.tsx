"use client";

import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaCarouselItem } from "../types";

export interface MainPreviewProps {
  item: MediaCarouselItem | null;
  /** CSS `aspect-ratio` value for the frame (the shared carousel aspect). */
  aspectCss: string;
  /** False for video items in v0.1 (edit deferred). */
  canEdit: boolean;
  labels: { edit: string; videoNotEditable: string };
  onEdit: () => void;
}

/**
 * The large preview of the currently-selected item, with an Edit affordance.
 * Images fill the shared-aspect frame (`object-cover`); videos keep their own
 * aspect on a black mat (`object-contain`). Video isn't editable in v0.1 — instead
 * of a disabled (unfocusable, unreadable) button we show a static caption that
 * IS in the reading order, so keyboard + screen-reader users get the reason.
 */
export function MainPreview({
  item,
  aspectCss,
  canEdit,
  labels,
  onEdit,
}: MainPreviewProps) {
  if (!item) {
    return (
      <div
        className="grid w-full place-items-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground"
        style={{ aspectRatio: aspectCss }}
      >
        <ImageIcon className="size-8" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
      style={{ aspectRatio: aspectCss }}
    >
      {item.kind === "video" ? (
        <video
          src={item.url}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            try {
              e.currentTarget.currentTime = 0.1;
            } catch {
              /* seeking unsupported — leave as-is */
            }
          }}
          className="size-full bg-black object-contain"
        />
      ) : (
        <img
          src={item.url}
          alt={item.fileName ?? ""}
          className="size-full object-cover"
        />
      )}

      <div className="absolute right-3 top-3">
        {canEdit ? (
          <Button type="button" size="sm" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden />
            {labels.edit}
          </Button>
        ) : (
          <span className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
            {labels.videoNotEditable}
          </span>
        )}
      </div>
    </div>
  );
}

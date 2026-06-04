"use client";

import { Pencil } from "lucide-react";
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
 * aspect on a black mat (`object-contain`) and are not croppable in v0.1.
 */
export function MainPreview({
  item,
  aspectCss,
  canEdit,
  labels,
  onEdit,
}: MainPreviewProps) {
  if (!item) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
      style={{ aspectRatio: aspectCss }}
    >
      {item.kind === "video" ? (
        <video
          src={item.url}
          controls
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
          // Native `title` (not the Tooltip primitive) — consumer-safe across
          // the radix/Base-UI primitive split (F-cross-13); no extra dep.
          <span title={labels.videoNotEditable} className="inline-flex">
            <Button
              type="button"
              size="sm"
              disabled
              aria-label={labels.videoNotEditable}
            >
              <Pencil className="size-4" aria-hidden />
              {labels.edit}
            </Button>
          </span>
        )}
      </div>
    </div>
  );
}

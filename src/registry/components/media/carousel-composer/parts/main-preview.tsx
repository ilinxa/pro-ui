"use client";

import type { ReactNode } from "react";
import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaCarouselItem } from "../types";

export interface MainPreviewProps {
  item: MediaCarouselItem | null;
  /** CSS `aspect-ratio` value for the frame (the shared carousel aspect). */
  aspectCss: string;
  /** True when the editing add-on is wired and this item may be edited. */
  canEdit: boolean;
  /** True when the editing add-on is wired. Without it the preview shows no edit UI. */
  editingEnabled?: boolean;
  labels: { edit: string; videoNotEditable: string };
  /** The aspect switch, shown over the top-start corner of the frame. */
  aspectSwitch?: ReactNode;
  onEdit: () => void;
}

/**
 * The large preview of the currently-selected item, with an Edit affordance.
 * Images fill the shared-aspect frame (`object-cover`); videos keep their own
 * aspect on a media-overlay mat (`object-contain`). A video is never editable — instead
 * of a disabled (unfocusable, unreadable) button we show a static caption that
 * IS in the reading order, so keyboard + screen-reader users get the reason.
 */
export function MainPreview({
  item,
  aspectCss,
  canEdit,
  editingEnabled = false,
  labels,
  aspectSwitch,
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
          poster={item.posterUrl}
          className="size-full bg-media-overlay object-contain"
        />
      ) : (
        <img
          src={item.url}
          alt={item.alt ?? item.fileName ?? ""}
          className="size-full object-cover"
        />
      )}

      {aspectSwitch ? <div className="absolute start-3 top-3">{aspectSwitch}</div> : null}

      {canEdit ? (
        <div className="absolute end-3 top-3">
          <Button type="button" size="sm" onClick={onEdit} data-edit-button="">
            <Pencil className="size-4" aria-hidden />
            {labels.edit}
          </Button>
        </div>
      ) : editingEnabled && item.kind === "video" ? (
        <div className="absolute end-3 top-3">
          <span className="rounded-full bg-media-overlay px-2.5 py-1 text-xs font-medium text-media-overlay-foreground">
            {labels.videoNotEditable}
          </span>
        </div>
      ) : null}
    </div>
  );
}

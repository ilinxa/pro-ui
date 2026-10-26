"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CarouselComposerLabels,
  MediaCarouselItem,
} from "../types";
import { UploadProgress, clampProgress } from "./upload-progress";

export interface ItemStatusProps {
  item: MediaCarouselItem | null;
  labels: Pick<
    CarouselComposerLabels,
    "uploadProgress" | "uploadFailed" | "retry"
  >;
  /** 1-based position of the item and the item count, for the progress name. */
  position: number;
  total: number;
  onRetry?: (item: MediaCarouselItem) => void;
}

/**
 * Upload state of the selected item, under the preview: a determinate progress
 * bar while uploading, the error text with a Retry (when `onRetry` is wired) on
 * error. Nothing for `uploaded`, no status, or `pending` (the rail thumb carries
 * the pending mark).
 */
export function ItemStatus({ item, labels, position, total, onRetry }: ItemStatusProps) {
  if (!item) return null;
  if (item.status === "uploading") {
    return (
      <UploadProgress
        progress={item.progress}
        itemId={item.id}
        label={labels.uploadProgress(clampProgress(item.progress), { position, total })}
      />
    );
  }
  if (item.status === "error") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
        <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden />
        <span className="min-w-0 flex-1">{item.error ?? labels.uploadFailed}</span>
        {onRetry ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onRetry(item)}
          >
            <RotateCw className="size-3.5" aria-hidden />
            {labels.retry}
          </Button>
        ) : null}
      </div>
    );
  }
  return null;
}

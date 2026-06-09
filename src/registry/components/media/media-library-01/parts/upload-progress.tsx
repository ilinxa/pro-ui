"use client";

import { AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fillTemplate } from "../lib/format";
import { useMediaLibrary } from "../hooks/use-media-library";
import type { MediaUploadItem } from "../types";
import { FileKindBadge } from "./file-visuals";

/** A tile for an in-flight optimistic upload (progress ring + error/retry). */
export function UploadProgressCard({ item }: { item: MediaUploadItem }) {
  const { labels, retryUpload, dismissUpload } = useMediaLibrary();
  const isError = item.status === "error";

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
        isError ? "border-destructive/50" : "border-border",
      )}
      aria-label={fillTemplate(labels.uploadingAria, { name: item.name })}
      aria-busy={!isError}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {item.previewUrl ? (
          <img src={item.previewUrl} alt="" className="size-full object-cover opacity-50" />
        ) : null}
        <div className="absolute inset-0 grid place-items-center">
          {isError ? (
            <AlertCircle className="size-7 text-destructive" aria-hidden="true" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-foreground">
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
              <span className="font-mono text-xs tabular-nums">{item.pct}%</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileKindBadge kind={item.kind} />
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        </div>
        {isError ? (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-destructive">{item.error}</span>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => retryUpload(item.tempId)}
              >
                {labels.retry}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-6"
                aria-label={labels.close}
                onClick={() => dismissUpload(item.tempId)}
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <Progress value={item.pct} className="h-1" />
        )}
      </div>
    </div>
  );
}

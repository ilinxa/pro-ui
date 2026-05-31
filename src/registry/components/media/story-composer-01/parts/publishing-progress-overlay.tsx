"use client";

import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoryComposer01Labels } from "../types";

export interface PublishingProgressOverlayProps {
  /** 0..1 — null when indeterminate (no length-computable from server). */
  progress: number | null;
  status: "uploading" | "done" | "error";
  errorMessage?: string;
  labels: Required<StoryComposer01Labels>;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function PublishingProgressOverlay({
  progress,
  status,
  errorMessage,
  labels,
  onRetry,
  onCancel,
  className,
}: PublishingProgressOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "absolute inset-0 z-40 grid place-items-center bg-black/85 backdrop-blur-sm text-white px-6",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        {status === "uploading" ? (
          <>
            <Loader2 className="size-10 animate-spin text-white/80" />
            <p className="text-base font-medium">{labels.publishing}</p>
            {progress !== null ? (
              <div className="w-full">
                <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-white transition-[width] duration-150"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-mono tabular-nums text-white/60">
                  {Math.round(progress * 100)}%
                </p>
              </div>
            ) : null}
            {onCancel ? (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                {labels.discardCancel /* reuses "Keep editing" copy */}
              </Button>
            ) : null}
          </>
        ) : status === "done" ? (
          <>
            <div className="grid place-items-center size-12 rounded-full bg-emerald-500 text-white">
              <Check className="size-7" />
            </div>
            <p className="text-base font-medium">{labels.published}</p>
          </>
        ) : (
          <>
            <AlertTriangle className="size-10 text-amber-400" />
            <p className="text-base font-medium">{labels.uploadFailedTitle}</p>
            {errorMessage ? (
              <p className="text-xs text-white/60 leading-relaxed">
                {errorMessage}
              </p>
            ) : null}
            {onRetry ? (
              <Button
                onClick={onRetry}
                className="bg-white text-black hover:bg-white/90"
              >
                {labels.uploadRetry}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

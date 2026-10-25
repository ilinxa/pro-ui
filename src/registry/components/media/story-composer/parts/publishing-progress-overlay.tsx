"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResolvedStoryComposerLabels } from "../types";

export interface PublishingProgressOverlayProps {
  /** 0..1 — null when indeterminate (no length-computable from server). */
  progress: number | null;
  /**
   * "done" is intentionally NOT a state here — the composer dismisses the
   * overlay on success (onPublished), so only the in-flight + error states
   * render. Kept narrow so the dead "published" arm can't drift back in.
   */
  status: "uploading" | "error";
  /** Error-state body text. Falls back to `labels.uploadFailedBody`. */
  errorMessage?: string;
  labels: ResolvedStoryComposerLabels;
  /** BCP-47 locale for the progress percentage. Invalid tags fall back to "en". */
  locale?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

const percentFormats = new Map<string, Intl.NumberFormat>();

/** Cached percent formatter; default "en" (SSR-deterministic), invalid tags fall back to "en". */
function percentFormat(locale: string | undefined): Intl.NumberFormat {
  const key = locale ?? "en";
  let fmt = percentFormats.get(key);
  if (!fmt) {
    const opts: Intl.NumberFormatOptions = {
      style: "percent",
      maximumFractionDigits: 0,
    };
    try {
      fmt = new Intl.NumberFormat(key, opts);
    } catch {
      fmt = new Intl.NumberFormat("en", opts);
    }
    percentFormats.set(key, fmt);
  }
  return fmt;
}

export function PublishingProgressOverlay({
  progress,
  status,
  errorMessage,
  labels,
  locale,
  onRetry,
  onCancel,
  className,
}: PublishingProgressOverlayProps) {
  const percent = percentFormat(locale);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);

  // The primary control of each state takes focus when the state appears: the
  // content swaps without the overlay unmounting, so nothing else moves focus.
  useEffect(() => {
    const target =
      status === "error"
        ? (retryRef.current ?? cancelRef.current)
        : cancelRef.current;
    target?.focus({ preventScroll: true });
  }, [status]);

  return (
    <div
      className={cn(
        // --media-overlay is black at 0.55 alpha: the blur carries the rest of
        // the old near-opaque scrim so the editor behind stays unreadable.
        "absolute inset-0 z-40 grid place-items-center rounded-[inherit] bg-media-overlay backdrop-blur-md backdrop-brightness-40 text-media-overlay-foreground px-6",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        {status === "uploading" ? (
          <>
            <Loader2 className="size-10 animate-spin text-media-overlay-foreground/80" />
            {/* Live region carries the status text only — the percentage below
                is outside it so it is not re-announced on every tick. */}
            <p role="status" className="text-base font-medium">
              {labels.publishing}
            </p>
            {progress !== null ? (
              <div className="w-full">
                <div className="h-1.5 w-full rounded-full bg-media-overlay-foreground/15 overflow-hidden">
                  <div
                    className="h-full bg-media-overlay-foreground transition-[width] duration-150"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-mono tabular-nums text-media-overlay-foreground/80">
                  {percent.format(Math.round(progress * 100) / 100)}
                </p>
              </div>
            ) : null}
            {onCancel ? (
              <Button
                ref={cancelRef}
                variant="ghost"
                onClick={onCancel}
                className="text-media-overlay-foreground/80 hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground"
              >
                {labels.discardCancel /* reuses "Keep editing" copy */}
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <AlertTriangle className="size-10 text-warning" />
            <div role="status" className="flex flex-col items-center gap-4">
              <p className="text-base font-medium">{labels.uploadFailedTitle}</p>
              <p className="text-xs text-media-overlay-foreground/80 leading-relaxed">
                {errorMessage ?? labels.uploadFailedBody}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onCancel ? (
                <Button
                  ref={cancelRef}
                  variant="ghost"
                  onClick={onCancel}
                  className="text-media-overlay-foreground/80 hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground"
                >
                  {labels.uploadCancel}
                </Button>
              ) : null}
              {onRetry ? (
                <Button ref={retryRef} onClick={onRetry}>
                  {labels.uploadRetry}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

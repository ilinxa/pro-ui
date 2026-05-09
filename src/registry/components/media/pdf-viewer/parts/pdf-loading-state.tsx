"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ResolvedPdfViewerLabels } from "../types";

interface PdfLoadingStateProps {
  labels: ResolvedPdfViewerLabels;
  className?: string;
}

export function PdfLoadingState({ labels, className }: PdfLoadingStateProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-start gap-4 overflow-hidden bg-muted/20 p-8",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{labels.loading}</span>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-[80vh] w-full max-w-2xl" />
    </div>
  );
}

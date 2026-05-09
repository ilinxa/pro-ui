"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResolvedPdfViewerLabels } from "../types";

interface PdfEmptyStateProps {
  labels: ResolvedPdfViewerLabels;
  enableDragDrop: boolean;
  className?: string;
}

export function PdfEmptyState({
  labels,
  enableDragDrop,
  className,
}: PdfEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 p-12 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileText className="size-7" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          {labels.emptyTitle}
        </p>
        {enableDragDrop ? (
          <p className="text-sm text-muted-foreground">{labels.emptyHint}</p>
        ) : null}
      </div>
    </div>
  );
}

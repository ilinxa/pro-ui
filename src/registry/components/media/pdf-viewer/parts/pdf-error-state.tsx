"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResolvedPdfViewerLabels } from "../types";

interface PdfErrorStateProps {
  error: Error;
  labels: ResolvedPdfViewerLabels;
  onRetry?: () => void;
  className?: string;
}

export function PdfErrorState({
  error,
  labels,
  onRetry,
  className,
}: PdfErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          {labels.errorTitle}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="size-3.5" aria-hidden="true" />
          {labels.errorRetry}
        </Button>
      ) : null}
    </div>
  );
}

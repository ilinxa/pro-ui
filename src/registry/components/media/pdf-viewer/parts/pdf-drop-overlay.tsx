"use client";

import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResolvedPdfViewerLabels } from "../types";

interface PdfDropOverlayProps {
  labels: ResolvedPdfViewerLabels;
  className?: string;
}

export function PdfDropOverlay({ labels, className }: PdfDropOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-30 flex items-center justify-center",
        "rounded-[inherit] border-2 border-dashed border-primary",
        "bg-primary/10 backdrop-blur-[2px]",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 rounded-lg bg-background/90 px-6 py-4 shadow-lg ring-1 ring-border">
        <Upload className="size-6 text-primary" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">
          {labels.dropPdfHere}
        </span>
      </div>
    </div>
  );
}

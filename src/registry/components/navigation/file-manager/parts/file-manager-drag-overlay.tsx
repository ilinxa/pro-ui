"use client";

import { FileUp } from "lucide-react";
import type { FileManagerLabels } from "../types";

interface FileManagerDragOverlayProps {
  visible: boolean;
  labels: FileManagerLabels;
}

export function FileManagerDragOverlay(props: FileManagerDragOverlayProps) {
  const { visible, labels } = props;
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-md border-2 border-dashed border-primary/70 bg-background/85 backdrop-blur-[2px]"
      role="presentation"
    >
      <div className="flex flex-col items-center gap-2 text-sm font-medium text-foreground">
        <FileUp className="size-6 text-primary" aria-hidden="true" />
        <span>{labels.externalDropOverlay}</span>
      </div>
    </div>
  );
}

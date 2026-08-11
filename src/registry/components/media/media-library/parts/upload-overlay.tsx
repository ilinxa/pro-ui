"use client";

import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "../hooks/use-media-library";

/** Tier C — dumb drop scrim. */
export function UploadOverlay({
  visible,
  label,
  className,
}: {
  visible: boolean;
  label: string;
  className?: string;
}) {
  if (!visible) return null;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-30 grid place-items-center rounded-xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[2px]",
        "motion-safe:animate-in motion-safe:fade-in-0",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <UploadCloud className="size-6" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
    </div>
  );
}

/** Tier B — context-connected drop scrim (driven by the root's drag handlers). */
export function MediaLibraryUploadOverlay({ className }: { className?: string }) {
  const { isDraggingFiles, labels } = useMediaLibrary();
  return (
    <UploadOverlay
      visible={isDraggingFiles}
      label={labels.dropToUpload}
      className={className}
    />
  );
}

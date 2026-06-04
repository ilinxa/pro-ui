"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MediaKind } from "../types";

export interface MediaDropzoneProps {
  variant: "empty" | "add-more";
  accept: MediaKind[];
  maxItems: number;
  disabled?: boolean;
  labels: {
    dropzoneTitle: string;
    dropzoneBrowse: string;
    dropzoneHint: string;
    addMore: string;
  };
  onFiles: (files: FileList) => void;
}

function acceptAttr(accept: MediaKind[]): string {
  return accept.map((k) => (k === "image" ? "image/*" : "video/*")).join(",");
}

/**
 * File intake surface. `variant="empty"` is the full-bleed first-run dropzone;
 * `variant="add-more"` is a compact rail-sized tile. Both wrap a hidden
 * `<input type="file" multiple>` — drag-and-drop is an enhancement layered on
 * top of the always-present Browse button (a11y: keyboard reaches the button).
 */
export function MediaDropzone({
  variant,
  accept,
  maxItems,
  disabled,
  labels,
  onFiles,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const open = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = ""; // allow re-picking the same file
    if (files?.length) onFiles(files);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept={acceptAttr(accept)}
      onChange={onChange}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
    />
  );

  if (variant === "add-more") {
    return (
      <button
        type="button"
        onClick={open}
        disabled={disabled}
        aria-label={labels.addMore}
        className={cn(
          "grid size-16 shrink-0 place-items-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Plus className="size-5" />
        {input}
      </button>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      aria-label={labels.dropzoneTitle}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition",
        dragging
          ? "border-ring bg-accent/40"
          : "border-border bg-muted/30",
      )}
    >
      <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          {labels.dropzoneTitle}
        </p>
        <p className="text-xs text-muted-foreground">
          {labels.dropzoneHint.replace("{max}", String(maxItems))}
        </p>
      </div>
      <Button type="button" size="sm" onClick={open} disabled={disabled}>
        {labels.dropzoneBrowse}
      </Button>
      {input}
    </div>
  );
}

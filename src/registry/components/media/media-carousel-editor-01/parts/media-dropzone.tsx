"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MediaKind } from "../types";

export interface MediaDropzoneProps {
  variant: "empty" | "add-more";
  accept: MediaKind[];
  maxItems: number;
  disabled?: boolean;
  /** Ingestion in progress — show a spinner + block input. */
  busy?: boolean;
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
 * `<input type="file" multiple>`, both accept drag-and-drop with hover feedback,
 * and both surface a `busy` spinner during ingestion. Drag-and-drop is an
 * enhancement on top of the always-present Browse button (keyboard path).
 */
export function MediaDropzone({
  variant,
  accept,
  maxItems,
  disabled,
  busy,
  labels,
  onFiles,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const blocked = disabled || busy;

  const open = () => inputRef.current?.click();

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!blocked) setDragging(true);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (blocked) return;
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
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={blocked}
        aria-label={labels.addMore}
        aria-busy={busy || undefined}
        className={cn(
          "grid size-16 shrink-0 place-items-center rounded-md border border-dashed bg-muted/40 text-muted-foreground transition hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-ring bg-accent/40 text-foreground" : "border-border",
        )}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-5" aria-hidden />
        )}
        {input}
      </button>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      aria-label={labels.dropzoneTitle}
      aria-busy={busy || undefined}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition",
        dragging ? "border-ring bg-accent/40" : "border-border bg-muted/30",
      )}
    >
      {busy ? (
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          {busy ? "Adding media…" : labels.dropzoneTitle}
        </p>
        <p className="text-xs text-muted-foreground">
          {labels.dropzoneHint.replace("{max}", String(maxItems))}
        </p>
      </div>
      <Button type="button" size="sm" onClick={open} disabled={blocked}>
        {labels.dropzoneBrowse}
      </Button>
      {input}
    </div>
  );
}

"use client";

import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MEDIA_LIBRARY_LABELS,
  type MediaLibrary01Labels,
  type MediaNode,
} from "../types";
import { FilePreview } from "./file-preview";
import { useMediaLibrary } from "../hooks/use-media-library";

export interface FilePreviewLightboxProps {
  nodes: MediaNode[];
  activeId: string | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
  resolveTextContent?: (node: MediaNode) => Promise<string>;
  pdfWorkerSrc?: string;
  onDownload?: (node: MediaNode) => void;
  labels?: Partial<MediaLibrary01Labels>;
}

/** Tier C — controlled full-screen lightbox stepping through `nodes`. */
export function FilePreviewLightbox({
  nodes,
  activeId,
  onClose,
  onNavigate,
  resolveTextContent,
  pdfWorkerSrc,
  onDownload,
  labels: labelOverrides,
}: FilePreviewLightboxProps) {
  const labels = { ...DEFAULT_MEDIA_LIBRARY_LABELS, ...labelOverrides };
  const index = activeId == null ? -1 : nodes.findIndex((n) => n.id === activeId);
  const node = index >= 0 ? nodes[index] : null;
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < nodes.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(nodes[index - 1].id);
  }, [hasPrev, nodes, index, onNavigate]);
  const goNext = useCallback(() => {
    if (hasNext) onNavigate(nodes[index + 1].id);
  }, [hasNext, nodes, index, onNavigate]);

  return (
    <Dialog
      open={node != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="h-[88vh] w-[96vw] max-w-[min(96vw,1100px)]! gap-0 overflow-hidden p-0"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") goPrev();
          else if (e.key === "ArrowRight") goNext();
        }}
      >
        <DialogTitle className="sr-only">{node?.name ?? labels.preview}</DialogTitle>
        <DialogDescription className="sr-only">{labels.preview}</DialogDescription>
        {node ? (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 pr-12">
              <p className="truncate text-sm font-medium text-foreground">{node.name}</p>
              <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                {index + 1} / {nodes.length}
              </span>
            </div>
            <div className="relative min-h-0 flex-1">
              <FilePreview
                node={node}
                variant="full"
                resolveTextContent={resolveTextContent}
                pdfWorkerSrc={pdfWorkerSrc}
                labels={labels}
                onDownload={onDownload}
                className="h-full"
              />
              {hasPrev ? (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={labels.prev}
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 size-9 -translate-y-1/2 rounded-full shadow-md"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </Button>
              ) : null}
              {hasNext ? (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={labels.next}
                  onClick={goNext}
                  className={cn(
                    "absolute right-3 top-1/2 size-9 -translate-y-1/2 rounded-full shadow-md",
                  )}
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Tier B — context-connected lightbox (steps through the current folder's files). */
export function MediaLibraryLightbox() {
  const ctx = useMediaLibrary();
  return (
    <FilePreviewLightbox
      nodes={ctx.files}
      activeId={ctx.previewId}
      onClose={ctx.closePreview}
      onNavigate={ctx.openPreview}
      resolveTextContent={ctx.resolveTextContent}
      pdfWorkerSrc={ctx.pdfWorkerSrc}
      onDownload={ctx.can.download ? (n) => ctx.download([n.id]) : undefined}
      labels={ctx.labels}
    />
  );
}

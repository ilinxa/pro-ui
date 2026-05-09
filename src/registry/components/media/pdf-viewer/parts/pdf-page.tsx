"use client";

import { Page } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { cn } from "@/lib/utils";
import type { PdfRotation } from "../types";

interface PdfPageProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: PdfRotation;
  /** Known intrinsic page size at scale=1, used for the placeholder when not visible. */
  basePageSize: { width: number; height: number } | null;
  /** When true, render only a placeholder div with the right height (virtualized away). */
  placeholder: boolean;
  className?: string;
}

export function PdfPage({
  pdfDocument,
  pageNumber,
  scale,
  rotation,
  basePageSize,
  placeholder,
  className,
}: PdfPageProps) {
  if (placeholder) {
    const rotated = rotation % 180 === 0;
    const w = basePageSize
      ? (rotated ? basePageSize.width : basePageSize.height) * scale
      : 600;
    const h = basePageSize
      ? (rotated ? basePageSize.height : basePageSize.width) * scale
      : 800;
    return (
      <div
        data-pdf-page={pageNumber}
        data-pdf-page-placeholder
        className={cn(
          "relative mx-auto rounded-md border border-dashed border-border bg-muted/30",
          className,
        )}
        style={{ width: w, height: h }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      data-pdf-page={pageNumber}
      className={cn("relative mx-auto", className)}
    >
      <Page
        pdf={pdfDocument}
        pageNumber={pageNumber}
        scale={scale}
        rotate={rotation}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        loading={
          <div
            className="rounded-md border border-border bg-muted/30"
            style={{
              width: basePageSize ? basePageSize.width * scale : 600,
              height: basePageSize ? basePageSize.height * scale : 800,
            }}
          />
        }
        className="overflow-hidden rounded-md shadow-sm ring-1 ring-border"
      />
    </div>
  );
}

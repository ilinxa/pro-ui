"use client";

import { createContext, useContext } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type {
  PdfActions,
  PdfDocumentState,
  ResolvedPdfViewerLabels,
} from "../types";

export interface PdfViewerContextValue extends PdfDocumentState {
  actions: PdfActions;
  labels: ResolvedPdfViewerLabels;
  allowDownload: boolean;
  allowPrint: boolean;
  compact: boolean;
  pdfDocument: PDFDocumentProxy | null;
}

export const PdfViewerContext = createContext<PdfViewerContextValue | null>(
  null,
);

export function usePdfViewer(): PdfViewerContextValue {
  const ctx = useContext(PdfViewerContext);
  if (ctx == null) {
    throw new Error(
      "usePdfViewer must be used inside <PdfViewer>. " +
        "Toolbar parts (PdfPageNav, PdfZoomControls, etc.) read state from " +
        "the viewer context and only work as descendants of <PdfViewer>.",
    );
  }
  return ctx;
}

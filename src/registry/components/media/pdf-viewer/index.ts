export { PdfViewer, default } from "./pdf-viewer";

// Toolbar parts (reads viewer context internally)
export { PdfToolbar } from "./parts/pdf-toolbar";
export { PdfPageNav } from "./parts/pdf-page-nav";
export { PdfPageIndicator } from "./parts/pdf-page-indicator";
export { PdfZoomControls } from "./parts/pdf-zoom-controls";
export { PdfActionMenu } from "./parts/pdf-action-menu";

// Public hook for advanced consumers building bespoke chrome
export { usePdfViewer } from "./hooks/use-pdf-viewer-context";

// Defaults
export { DEFAULT_PDF_VIEWER_LABELS } from "./types";

export type {
  PdfSource,
  PdfInitialScale,
  PdfRotation,
  PdfFitMode,
  PdfVirtualizeMode,
  PdfStatus,
  PdfActions,
  PdfDocumentState,
  PdfToolbarContext,
  PdfContextMenuContext,
  PdfPasswordPromptContext,
  PdfViewerHandle,
  PdfViewerLabels,
  PdfViewerProps,
} from "./types";

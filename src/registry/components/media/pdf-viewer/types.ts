import type { CSSProperties, ReactNode } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export type PdfSource = string | File | Blob | ArrayBuffer | Uint8Array;

export type PdfInitialScale = "fit-width" | "fit-page" | number;

export type PdfRotation = 0 | 90 | 180 | 270;

export type PdfFitMode = "fit-width" | "fit-page" | null;

export type PdfVirtualizeMode = "auto" | "always" | "never";

export type PdfStatus =
  | "empty"
  | "loading"
  | "password"
  | "ready"
  | "error";

export interface PdfActions {
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  setScale: (scale: number | "fit-width" | "fit-page") => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  rotate: (deltaDegrees?: number) => void;
  setRotation: (rotation: PdfRotation) => void;
  download: () => void;
  print: () => void;
}

export interface PdfDocumentState {
  page: number;
  numPages: number;
  scale: number;
  fitMode: PdfFitMode;
  rotation: PdfRotation;
  loading: boolean;
  ready: boolean;
  error: Error | null;
  source: PdfSource | null;
  selectedText: string;
  status: PdfStatus;
}

export interface PdfToolbarContext extends PdfDocumentState {
  actions: PdfActions;
  allowDownload: boolean;
  allowPrint: boolean;
  compact: boolean;
}

export interface PdfContextMenuContext extends PdfDocumentState {
  actions: PdfActions;
  position: { x: number; y: number };
  closeMenu: () => void;
  onSearch: ((text: string) => void) | null;
}

export interface PdfPasswordPromptContext {
  submit: (password: string) => void;
  cancel: () => void;
  error: Error | null;
  attempts: number;
}

export interface PdfViewerHandle {
  actions: PdfActions;
  state: PdfDocumentState;
  pdfDocument: PDFDocumentProxy | null;
}

export interface PdfViewerLabels {
  prevPage?: ReactNode;
  nextPage?: ReactNode;
  zoomIn?: ReactNode;
  zoomOut?: ReactNode;
  fitWidth?: ReactNode;
  fitPage?: ReactNode;
  resetZoom?: ReactNode;
  rotate?: ReactNode;
  download?: ReactNode;
  print?: ReactNode;
  pageOfTotal?: (page: number, total: number) => string;
  scalePercent?: (scale: number) => string;
  more?: ReactNode;
  jumpToPage?: ReactNode;

  loading?: ReactNode;
  emptyTitle?: ReactNode;
  emptyHint?: ReactNode;
  errorTitle?: ReactNode;
  errorRetry?: ReactNode;

  dropPdfHere?: ReactNode;
  notAPdfFile?: ReactNode;

  passwordTitle?: ReactNode;
  passwordHint?: ReactNode;
  passwordPlaceholder?: string;
  passwordSubmit?: ReactNode;
  passwordCancel?: ReactNode;
  passwordError?: ReactNode;

  copyText?: ReactNode;
  searchSelection?: ReactNode;
  contextNextPage?: ReactNode;
  contextPrevPage?: ReactNode;
  contextZoomIn?: ReactNode;
  contextZoomOut?: ReactNode;
  contextRotate?: ReactNode;
  contextDownload?: ReactNode;
  contextPrint?: ReactNode;

  toolbarAriaLabel?: string;
  viewerAriaLabel?: string;
}

export type ResolvedPdfViewerLabels = Omit<
  Required<PdfViewerLabels>,
  "pageOfTotal" | "scalePercent"
> & {
  pageOfTotal: (page: number, total: number) => string;
  scalePercent: (scale: number) => string;
};

export const DEFAULT_PDF_VIEWER_LABELS: ResolvedPdfViewerLabels = {
  prevPage: "Previous page",
  nextPage: "Next page",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fitWidth: "Fit width",
  fitPage: "Fit page",
  resetZoom: "Reset zoom",
  rotate: "Rotate",
  download: "Download",
  print: "Print",
  pageOfTotal: (page, total) => `Page ${page} of ${total}`,
  scalePercent: (scale) => `${Math.round(scale * 100)}%`,
  more: "More actions",
  jumpToPage: "Jump to page",

  loading: "Loading PDF…",
  emptyTitle: "No document loaded",
  emptyHint: "Drop a PDF here, or pass a `source` prop.",
  errorTitle: "Couldn't load this PDF",
  errorRetry: "Try again",

  dropPdfHere: "Drop PDF here",
  notAPdfFile: "Only PDF files are supported.",

  passwordTitle: "This PDF is password-protected",
  passwordHint: "Enter the password to view it.",
  passwordPlaceholder: "Password",
  passwordSubmit: "Unlock",
  passwordCancel: "Cancel",
  passwordError: "Wrong password. Try again.",

  copyText: "Copy text",
  searchSelection: "Search selection",
  contextNextPage: "Next page",
  contextPrevPage: "Previous page",
  contextZoomIn: "Zoom in",
  contextZoomOut: "Zoom out",
  contextRotate: "Rotate",
  contextDownload: "Download",
  contextPrint: "Print",

  toolbarAriaLabel: "PDF viewer controls",
  viewerAriaLabel: "PDF document viewer",
};

export interface PdfViewerProps {
  source?: PdfSource | null;

  toolbar?: boolean;
  renderToolbar?: (ctx: PdfToolbarContext) => ReactNode;

  enableDragDrop?: boolean;
  dragDropOverlay?: boolean;

  initialPage?: number;
  initialScale?: PdfInitialScale;
  initialRotation?: PdfRotation;

  virtualize?: PdfVirtualizeMode;
  virtualizeThreshold?: number;

  enableContextMenu?: boolean;
  renderContextMenu?: (ctx: PdfContextMenuContext) => ReactNode;
  onSearchSelection?: (args: { text: string }) => void;

  password?: string;
  renderPasswordPrompt?: (ctx: PdfPasswordPromptContext) => ReactNode;

  workerSrc?: string;

  allowDownload?: boolean;
  allowPrint?: boolean;
  downloadFilename?: string;

  onLoad?: (args: { numPages: number; pdfDocument: PDFDocumentProxy }) => void;
  onError?: (args: { error: Error; source: PdfSource | null }) => void;
  onPageChange?: (args: { page: number; source: PdfSource | null }) => void;
  onScaleChange?: (args: { scale: number; fitMode: PdfFitMode }) => void;
  onRotationChange?: (args: { rotation: PdfRotation }) => void;
  onSelection?: (args: { text: string }) => void;
  onSourceChange?: (args: {
    source: PdfSource | null;
    reason: "prop" | "drop";
  }) => void;

  className?: string;
  style?: CSSProperties;
  scrollContainerClassName?: string;
  pageClassName?: string;

  labels?: PdfViewerLabels;

  ariaLabel?: string;
}

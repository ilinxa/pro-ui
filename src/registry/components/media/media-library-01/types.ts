import type { ReactNode, Ref } from "react";

/**
 * FsNode is DECLARED LOCALLY (not imported from file-tree).
 *
 * VERIFIED 2026-06-09: `file-tree.tsx` only *imports* `FsNode` (no tail
 * re-export band), so a `.tsx`-entry type import would fail; a `/types`
 * subpath import trips the F-S1 slug-rewriter; and adding a tail band to
 * `file-tree.tsx` would modify a shipped component (forbidden). Re-declaring
 * the (tiny, stable) interface keeps file-tree UNTOUCHED and zeroes the
 * cross-procomp *type* surface — structural typing bridges at the composed
 * `<FileTree nodes={...}>` boundary (the media-carousel-editor-01
 * "define your own type locally" precedent).
 */
export type FsNodeType = "file" | "folder";

export interface FsNode {
  id: string;
  name: string;
  type: FsNodeType;
  parentId?: string | null;
  /** `undefined` ⇒ lazy-load trigger; `[]` ⇒ known-empty; `FsNode[]` ⇒ loaded. */
  children?: FsNode[];
  ext?: string;
  /** Bytes. */
  size?: number;
  /** ISO 8601. */
  modifiedAt?: string;
  icon?: ReactNode;
  meta?: Record<string, unknown>;
}

/** Which viewer a file maps to in the preview dispatcher. */
export type MediaPreviewKind =
  | "image"
  | "video"
  | "pdf"
  | "code"
  | "json"
  | "text"
  | "markdown"
  | "unknown";

/** Type-filter chip identity. */
export type MediaFilterCategory = "all" | "images" | "video" | "pdfs" | "docs";

/**
 * A media-library node. Strict superset of {@link FsNode} — every added field
 * is optional, so any `FsNode[]` is assignable to `MediaNode[]` (interop with
 * file-tree / file-manager preserved).
 */
export interface MediaNode extends FsNode {
  /** Canonical asset URL — the preview source. */
  url?: string;
  /** Poster / thumbnail for the grid (images fall back to `url`). */
  thumbnailUrl?: string;
  /** Authoritative MIME type; `ext` is the fallback for kind resolution. */
  mimeType?: string;
  width?: number;
  height?: number;
  owner?: string;
  children?: MediaNode[];
}

export interface MediaLibrary01Storage {
  /** Bytes used. */
  used: number;
  /** Bytes total. */
  total: number;
}

/**
 * Fires repeatedly during a single file's upload (0–100); consumer-driven.
 * `onUpload` is invoked once per file, so the progress fn is pre-bound to that
 * file's optimistic item — the consumer just reports its percent.
 */
export type MediaUploadProgressFn = (pct: number) => void;

/** Internal status of an optimistic upload placeholder. */
export type MediaUploadStatus = "uploading" | "error";

/** An in-flight optimistic upload item shown in the grid before it resolves. */
export interface MediaUploadItem {
  tempId: string;
  name: string;
  kind: MediaPreviewKind;
  pct: number;
  status: MediaUploadStatus;
  /** Object URL for a local preview while uploading (owned + revoked by the lib). */
  previewUrl?: string;
  error?: string;
  /** The folder the upload targets. */
  targetFolderId: string | null;
}

export interface MediaLibrary01Labels {
  title?: string;
  searchPlaceholder?: string;
  uploadButton?: string;
  newFolderButton?: string;
  foldersHeading?: string;
  filesHeading?: string;
  libraryHeading?: string;
  /** Template with `{used}` and `{total}`, e.g. "{used} of {total} used". */
  quotaUsed?: string;
  filterAll?: string;
  filterImages?: string;
  filterVideo?: string;
  filterPdfs?: string;
  filterDocs?: string;
  emptyFolder?: string;
  emptyLibrary?: string;
  dropToUpload?: string;
  previewLoading?: string;
  previewError?: string;
  noPreview?: string;
  download?: string;
  retry?: string;
  // context-menu verbs
  open?: string;
  preview?: string;
  rename?: string;
  move?: string;
  cut?: string;
  copy?: string;
  paste?: string;
  delete?: string;
  // a11y
  /** Template with `{name}` and `{kind}`. */
  itemAria?: string;
  /** Template with `{name}`. */
  uploadingAria?: string;
  /** Template with `{count}`. */
  selectedAria?: string;
  prev?: string;
  next?: string;
  close?: string;
}

export type MediaLibraryPreviewMode = "pane" | "lightbox" | "both" | false;

/**
 * Shared data + handler surface. {@link MediaLibrary01Props} adds the chrome
 * toggles on top of this; {@link MediaLibraryRootProps} is this verbatim
 * (composition replaces the toggles).
 */
export interface MediaLibraryRootProps {
  nodes: MediaNode[];
  currentFolderId?: string | null;
  defaultCurrentFolderId?: string | null;
  onCurrentFolderChange?: (folderId: string | null) => void;
  onLoadChildren?: (folderId: string) => Promise<MediaNode[]>;

  storage?: MediaLibrary01Storage;

  selectedIds?: Set<string>;
  defaultSelectedIds?: Set<string>;
  onSelectedChange?: (ids: Set<string>) => void;

  // mutation operations (omit to hide the affordance).
  // `onUpload` is called once per file; `progress` reports that file's percent.
  onUpload?: (
    files: File[],
    targetFolderId: string | null,
    progress: MediaUploadProgressFn,
  ) => Promise<MediaNode[]>;
  onMove?: (ids: string[], targetFolderId: string | null) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (ids: string[]) => void;
  onCreateFolder?: (parentId: string | null, name: string) => void;
  onDownload?: (ids: string[]) => void;
  validateRename?: (id: string, name: string) => string | null;

  // preview content sourcing (URL-based; text kinds fetched by the lib)
  resolveTextContent?: (node: MediaNode) => Promise<string>;
  /**
   * Override the pdf.js worker URL used by the composed pdf-viewer. The viewer
   * defaults to a unpkg CDN worker; pass a self-hosted path
   * (e.g. "/pdf.worker.min.mjs") for offline / locked-down environments.
   */
  pdfWorkerSrc?: string;
  onPreviewOpen?: (id: string) => void;
  onPreviewClose?: () => void;

  // behaviour
  enableUploadDrop?: boolean;
  enableInternalDrag?: boolean;
  enableContextMenu?: boolean;
  /** Whether opening a file shows a preview at all (default "both"). */
  preview?: MediaLibraryPreviewMode;
  virtualizeThreshold?: number;

  labels?: Partial<MediaLibrary01Labels>;
  children?: ReactNode;
  className?: string;
  ref?: Ref<MediaLibrary01Handle>;
}

/** The batteries-included assembly: root surface + chrome toggles. */
export interface MediaLibrary01Props
  extends Omit<MediaLibraryRootProps, "children"> {
  showQuota?: boolean;
  showTypeFilters?: boolean;
  showSidebar?: boolean;
}

export interface MediaLibrary01Handle {
  navigateTo: (folderId: string | null) => void;
  refresh: (folderId?: string | null) => void;
  openPreview: (id: string) => void;
  closePreview: () => void;
  /** Opens the OS file picker for the current folder. */
  triggerUpload: () => void;
  getSelectedIds: () => string[];
  clearSelection: () => void;
}

export const DEFAULT_MEDIA_LIBRARY_LABELS: Required<MediaLibrary01Labels> = {
  title: "Media library",
  searchPlaceholder: "Search this folder",
  uploadButton: "Upload",
  newFolderButton: "New folder",
  foldersHeading: "Folders",
  filesHeading: "Files",
  libraryHeading: "Library",
  quotaUsed: "{used} of {total} used",
  filterAll: "All",
  filterImages: "Images",
  filterVideo: "Video",
  filterPdfs: "PDFs",
  filterDocs: "Docs",
  emptyFolder: "This folder is empty",
  emptyLibrary: "No media yet — upload to get started",
  dropToUpload: "Drop files to upload",
  previewLoading: "Loading preview…",
  previewError: "Couldn't load this file",
  noPreview: "No preview available",
  download: "Download",
  retry: "Retry",
  open: "Open",
  preview: "Preview",
  rename: "Rename",
  move: "Move",
  cut: "Cut",
  copy: "Copy",
  paste: "Paste",
  delete: "Delete",
  itemAria: "{name}, {kind}",
  uploadingAria: "Uploading {name}",
  selectedAria: "{count} selected",
  prev: "Previous",
  next: "Next",
  close: "Close",
};

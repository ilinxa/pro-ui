// Tier A — batteries-included assembly
export { MediaLibrary01 } from "./media-library-01";

// Tier B — headless provider + context-connected parts (compose your own)
export { MediaLibraryRoot } from "./parts/media-library-root";
export { MediaLibraryToolbar } from "./parts/library-toolbar";
export { MediaLibraryQuotaBar } from "./parts/quota-bar";
export { MediaLibraryTypeFilters } from "./parts/type-filters";
export { MediaLibraryBreadcrumbs } from "./parts/breadcrumbs";
export { MediaLibrarySidebar } from "./parts/sidebar";
export { MediaLibraryFolderRow } from "./parts/folder-row";
export { MediaLibraryFileGrid } from "./parts/file-grid";
export { MediaLibraryDetailsPane } from "./parts/details-pane";
export { MediaLibraryLightbox } from "./parts/preview-lightbox";
export { MediaLibraryUploadOverlay } from "./parts/upload-overlay";

// Tier C — standalone primitives (no context)
export { FilePreview } from "./parts/file-preview";
export { FilePreviewLightbox } from "./parts/preview-lightbox";
export { FileCard } from "./parts/file-card";
export { FolderCard } from "./parts/folder-card";
export { QuotaBar } from "./parts/quota-bar";
export { UploadOverlay } from "./parts/upload-overlay";
export { FileKindBadge, PreviewKindIcon } from "./parts/file-visuals";

// Hook + helpers
export { useMediaLibrary } from "./hooks/use-media-library";
export type { MediaLibraryContextValue } from "./hooks/use-media-library";
export { resolvePreviewKind, isTextKind, extOf } from "./lib/preview-kind";
export {
  filterCategoryForNode,
  filterCategoryForKind,
  computeFilterCounts,
} from "./lib/filter-category";
export { formatBytes, formatRelativeTime } from "./lib/format";

// Defaults
export { DEFAULT_MEDIA_LIBRARY_LABELS } from "./types";

// Part prop types
export type { QuotaBarProps } from "./parts/quota-bar";
export type { FileCardProps } from "./parts/file-card";
export type { FolderCardProps } from "./parts/folder-card";
export type { FilePreviewProps } from "./parts/file-preview";
export type { FilePreviewLightboxProps } from "./parts/preview-lightbox";

// Public types
export type {
  FsNode,
  FsNodeType,
  MediaNode,
  MediaPreviewKind,
  MediaFilterCategory,
  MediaLibrary01Storage,
  MediaUploadItem,
  MediaUploadStatus,
  MediaUploadProgressFn,
  MediaLibrary01Labels,
  MediaLibraryPreviewMode,
  MediaLibraryRootProps,
  MediaLibrary01Props,
  MediaLibrary01Handle,
} from "./types";

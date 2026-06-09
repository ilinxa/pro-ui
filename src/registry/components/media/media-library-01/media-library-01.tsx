"use client";

import { forwardRef } from "react";
import type { MediaLibrary01Handle, MediaLibrary01Props } from "./types";
import { MediaLibraryRoot } from "./parts/media-library-root";
import { MediaLibraryToolbar } from "./parts/library-toolbar";
import { MediaLibraryQuotaBar } from "./parts/quota-bar";
import { MediaLibraryTypeFilters } from "./parts/type-filters";
import { MediaLibraryBreadcrumbs } from "./parts/breadcrumbs";
import { MediaLibrarySidebar } from "./parts/sidebar";
import { MediaLibraryFolderRow } from "./parts/folder-row";
import { MediaLibraryFileGrid } from "./parts/file-grid";
import { MediaLibraryDetailsPane } from "./parts/details-pane";
import { MediaLibraryLightbox } from "./parts/preview-lightbox";

/**
 * Tier A — the batteries-included Google-Drive-style media library. A thin
 * assembly of `<MediaLibraryRoot>` + the canonical parts, gated by the
 * `show*` / `preview` toggles. For a lighter, hand-composed version, drop down
 * to `<MediaLibraryRoot>` + the individual parts (all exported).
 */
export const MediaLibrary01 = forwardRef<MediaLibrary01Handle, MediaLibrary01Props>(
  function MediaLibrary01(props, ref) {
    const {
      showQuota = true,
      showTypeFilters = true,
      showSidebar = true,
      preview = "both",
      className,
      ...rootProps
    } = props;

    const showPane = preview === "pane" || preview === "both";
    const showLightbox = preview === "lightbox" || preview === "both";

    return (
      <MediaLibraryRoot
        ref={ref}
        preview={preview}
        className={className}
        {...rootProps}
      >
        {showQuota ? <MediaLibraryQuotaBar /> : null}
        <MediaLibraryToolbar />
        {showTypeFilters ? <MediaLibraryTypeFilters /> : null}
        <MediaLibraryBreadcrumbs />
        <div className="flex min-h-0 gap-4">
          {showSidebar ? <MediaLibrarySidebar /> : null}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <MediaLibraryFolderRow />
            <MediaLibraryFileGrid />
          </div>
          {showPane ? <MediaLibraryDetailsPane /> : null}
        </div>
        {showLightbox ? <MediaLibraryLightbox /> : null}
      </MediaLibraryRoot>
    );
  },
);

// --- Tail re-export band (F-01): a future cross-procomp consumer imports public
// types from this `.tsx` entry, never a `/types` subpath. ---
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
